import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'canvas.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode, busy timeout and foreign keys
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize database schema
export function initDB() {
  // 1. Users Table (Strict username as <name>@<role>)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL, -- format: <name>@<role> (e.g. murugan@cvs, sudhan@ceo)
      email TEXT,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,           -- ceo, admin, cvs, cfo, cco
      role_title TEXT,
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Auto-migrate if columns are missing in existing users table
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const colNames = tableInfo.map(col => col.name);
    
    if (!colNames.includes('username')) {
      db.exec(`ALTER TABLE users ADD COLUMN username TEXT;`);
    }
    if (!colNames.includes('status')) {
      db.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE';`);
    }
    if (!colNames.includes('updated_at')) {
      db.exec(`ALTER TABLE users ADD COLUMN updated_at DATETIME;`);
    }
  } catch (e) {
    console.warn("User migration check:", e.message);
  }

  // 2. PendingUserActions Table (For CEO Approval Queue)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_user_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,          -- CREATE, ROLE_CHANGE, DELETE
      target_user_id INTEGER,             -- NULL for CREATE, User ID for ROLE_CHANGE / DELETE
      target_user_data TEXT NOT NULL,     -- JSON string containing username, name, role, role_title, initial_password, etc.
      requested_by_id INTEGER NOT NULL,
      requested_by_name TEXT NOT NULL,
      requested_by_role TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',      -- PENDING, APPROVED, REJECTED
      reviewed_by_id INTEGER,
      reviewed_by_name TEXT,
      reviewed_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Visits Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canvasser_id INTEGER NOT NULL,
      canvasser_name TEXT NOT NULL,
      is_from_master_db INTEGER DEFAULT 0,
      master_school_id TEXT,
      school_name TEXT NOT NULL,
      district TEXT NOT NULL,
      cluster_or_block TEXT,
      institution_type TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      student_strength INTEGER,
      product_interests TEXT NOT NULL, -- JSON array of strings
      product_specifications TEXT,
      attachments TEXT DEFAULT '[]',   -- JSON array of objects
      interest_level TEXT NOT NULL,    -- Hot, Warm, Cold, Not Interested
      outcome_status TEXT NOT NULL,    -- Open, Sample Sent, Quote Given, Won, Lost, Not Interested
      follow_up_date TEXT,
      notes TEXT,
      last_edited_by_name TEXT,
      last_edited_by_role TEXT,
      last_edited_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (canvasser_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. AuditLogs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER,
      actor_id INTEGER NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,            -- CREATE, UPDATE, DELETE
      changed_fields TEXT NOT NULL,    -- JSON array: [{ field, from, to }]
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 5. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_price REAL NOT NULL,
      unit TEXT NOT NULL,
      hsn TEXT NOT NULL,
      gst_rate REAL DEFAULT 18.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Quotations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      visit_id INTEGER,
      canvasser_id INTEGER NOT NULL,
      canvasser_name TEXT NOT NULL,
      school_name TEXT NOT NULL,
      district TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      items TEXT NOT NULL,             -- JSON array
      subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      grand_total REAL NOT NULL,
      status TEXT DEFAULT 'Sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (canvasser_id) REFERENCES users(id)
    );
  `);

  // 7. Invoices Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      quotation_id TEXT,
      visit_id INTEGER,
      canvasser_id INTEGER NOT NULL,
      canvasser_name TEXT NOT NULL,
      school_name TEXT NOT NULL,
      district TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      items TEXT NOT NULL,             -- JSON array
      subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      grand_total REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      outstanding_balance REAL NOT NULL,
      payment_status TEXT DEFAULT 'Unpaid',
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (canvasser_id) REFERENCES users(id)
    );
  `);

  // 8. Payments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      school_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      reference_number TEXT,
      recorded_by_name TEXT NOT NULL,
      recorded_by_role TEXT NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );
  `);

  seedDefaultData();
}

function seedDefaultData() {
  const defaultPasswordHash = bcrypt.hashSync('password', 10);

  // Seed / Sync Default Users with strict <name>@<role> format
  const seedUsers = [
    { id: 10, username: 'sudhan@ceo', email: 'sudhan@murugan.com', name: 'Sudhan', role: 'ceo', role_title: 'Chief Executive Officer' },
    { id: 11, username: 'abhishek@cfo', email: 'abhishek@murugan.com', name: 'Abhishek', role: 'cfo', role_title: 'Chief Financial Officer' },
    { id: 12, username: 'varshini@cco', email: 'varshini@murugan.com', name: 'Varshini', role: 'cco', role_title: 'Chief Commercial Officer' },
    { id: 4, username: 'admin@admin', email: 'admin@murugan.com', name: 'Admin', role: 'admin', role_title: 'Admin Executive' },
    { id: 1, username: 'gokul@cvs', email: 'gokul@murugan.com', name: 'Gokul', role: 'cvs', role_title: 'Senior Canvasser' },
    { id: 2, username: 'murugan@cvs', email: 'murugan@murugan.com', name: 'Murugan', role: 'cvs', role_title: 'Field Sales Lead' },
    { id: 3, username: 'suhas@cvs', email: 'suhas@murugan.com', name: 'Suhas', role: 'cvs', role_title: 'Field Canvasser' }
  ];

  for (const u of seedUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR id = ?').get(u.username, u.id);
    if (!existing) {
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, name, role, role_title, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(u.id, u.username, u.email, defaultPasswordHash, u.name, u.role, u.role_title);
    } else {
      // Ensure username and role match strict format
      db.prepare(`
        UPDATE users SET username = ?, role = ?, role_title = ?, name = ? WHERE id = ?
      `).run(u.username, u.role, u.role_title, u.name, u.id);
    }
  }

  // Seed Default Products
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (prodCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (name, category, unit_price, unit, hsn, gst_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const products = [
      ['Socks (Cotton Combed)', 'Hosiery', 38.00, 'pair', '611595', 18.0],
      ['School Uniform (Shirt + Trouser/Skirt)', 'Apparel', 480.00, 'set', '620342', 18.0],
      ['School Belts with Metal Crest', 'Accessories', 55.00, 'pcs', '392690', 18.0],
      ['School Tie (Sublimation Crest)', 'Accessories', 42.00, 'pcs', '621510', 18.0],
      ['Sports Shoes (Non-marking Rubber Sole)', 'Footwear', 360.00, 'pair', '640411', 18.0],
      ['School Backpack / College Bags', 'Bags', 310.00, 'pcs', '420212', 18.0],
      ['Track Pants with Side Stripes', 'Sportswear', 210.00, 'pcs', '610343', 18.0]
    ];

    for (const p of products) {
      insertProduct.run(...p);
    }
  }

  // Seed Initial Visits
  const visitCount = db.prepare('SELECT COUNT(*) as count FROM visits').get().count;
  if (visitCount === 0) {
    const insertVisit = db.prepare(`
      INSERT INTO visits (
        id, canvasser_id, canvasser_name, is_from_master_db, master_school_id,
        school_name, district, cluster_or_block, institution_type, contact_person,
        phone, student_strength, product_interests, product_specifications,
        attachments, interest_level, outcome_status, follow_up_date, notes,
        last_edited_by_name, last_edited_by_role, last_edited_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const visits = [
      {
        id: 1,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        is_from_master_db: 1,
        master_school_id: 'SCH-CBE-001',
        school_name: "St. John's Higher Secondary School",
        district: 'Coimbatore',
        cluster_or_block: 'Coimbatore South',
        institution_type: 'School',
        contact_person: 'Mr. Ramesh (Principal)',
        phone: '9876543210',
        student_strength: 1200,
        product_interests: JSON.stringify(['Socks', 'Uniforms', 'Belts']),
        product_specifications: 'Requires 100% combed cotton navy-blue socks with white twin stripes and embroidered crest on buckle belts.',
        attachments: JSON.stringify([
          { id: 'att-1', name: 'school_sock_sample.jpg', url: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80', type: 'image/jpeg' }
        ]),
        interest_level: 'Hot',
        outcome_status: 'Sample Sent',
        follow_up_date: new Date(now + 86400000 * 2).toISOString().split('T')[0],
        notes: 'Very interested in 1200 custom combed-cotton socks and school belts. Sample pack sent yesterday.',
        last_edited_by_name: 'Sudhan',
        last_edited_by_role: 'Admin',
        last_edited_at: new Date(now - 86400000 * 1).toISOString(),
        created_at: new Date(now - 86400000 * 3).toISOString(),
        updated_at: new Date(now - 86400000 * 1).toISOString()
      },
      {
        id: 2,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        is_from_master_db: 0,
        master_school_id: null,
        school_name: 'Vivekananda Arts & Science College',
        district: 'Madurai',
        cluster_or_block: 'Madurai Central',
        institution_type: 'College',
        contact_person: 'Mrs. Priya (Admin Officer)',
        phone: '9876543211',
        student_strength: 3500,
        product_interests: JSON.stringify(['Bags', 'Ties', 'Track Pants']),
        product_specifications: 'Quote provided for 800 custom college bags and ties.',
        attachments: JSON.stringify([]),
        interest_level: 'Warm',
        outcome_status: 'Quote Given',
        follow_up_date: new Date(now - 86400000 * 1).toISOString().split('T')[0],
        notes: 'Quote provided for 800 custom college bags and ties. Follow up with purchasing committee.',
        last_edited_by_name: 'Gokul',
        last_edited_by_role: 'Canvasser',
        last_edited_at: new Date(now - 86400000 * 2).toISOString(),
        created_at: new Date(now - 86400000 * 5).toISOString(),
        updated_at: new Date(now - 86400000 * 2).toISOString()
      },
      {
        id: 3,
        canvasser_id: 2,
        canvasser_name: 'Murugan',
        is_from_master_db: 0,
        master_school_id: null,
        school_name: 'PSG Public Matriculation School',
        district: 'Coimbatore',
        cluster_or_block: 'Peelamedu',
        institution_type: 'School',
        contact_person: 'Dr. Kavin (Correspondent)',
        phone: '9876543212',
        student_strength: 2000,
        product_interests: JSON.stringify(['Shoes', 'Track Pants', 'Socks']),
        product_specifications: 'Deal closed for 2,000 pairs of sports shoes and track pants.',
        attachments: JSON.stringify([]),
        interest_level: 'Hot',
        outcome_status: 'Won',
        follow_up_date: new Date(now + 86400000 * 10).toISOString().split('T')[0],
        notes: 'Deal closed for 2,000 pairs of sports shoes and track pants! Initial advance received.',
        last_edited_by_name: 'Murugan',
        last_edited_by_role: 'Canvasser',
        last_edited_at: new Date(now - 86400000 * 1).toISOString(),
        created_at: new Date(now - 86400000 * 2).toISOString(),
        updated_at: new Date(now - 86400000 * 1).toISOString()
      }
    ];

    for (const v of visits) {
      insertVisit.run(
        v.id, v.canvasser_id, v.canvasser_name, v.is_from_master_db, v.master_school_id,
        v.school_name, v.district, v.cluster_or_block, v.institution_type, v.contact_person,
        v.phone, v.student_strength, v.product_interests, v.product_specifications,
        v.attachments, v.interest_level, v.outcome_status, v.follow_up_date, v.notes,
        v.last_edited_by_name, v.last_edited_by_role, v.last_edited_at, v.created_at, v.updated_at
      );

      insertAudit.run(
        v.id,
        v.canvasser_id,
        v.canvasser_name,
        'Canvasser',
        'CREATE',
        JSON.stringify([
          { field: 'Initial Record', from: 'None', to: `Logged visit for ${v.school_name}` }
        ]),
        v.created_at
      );
    }
  }
}
