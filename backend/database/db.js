import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { loadAndParseSchoolsFromCSVs } from './seedSchools.js';

import { pgDb, initPgDB } from './pgAdapter.js';
import { seedRefrensData } from './seedRefrens.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'canvas.db');

let sqliteDb = null;
if (!process.env.DATABASE_URL) {
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA busy_timeout = 5000;');
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
}

export const db = {
  exec(sql) {
    if (process.env.DATABASE_URL) {
      return pgDb.exec(sql);
    }
    return sqliteDb.exec(sql);
  },
  prepare(sql) {
    if (process.env.DATABASE_URL) {
      return pgDb.prepare(sql);
    }
    const stmt = sqliteDb.prepare(sql);
    const sanitize = (params) => params.map(p => p === undefined ? null : p);
    return {
      run(...params) {
        return stmt.run(...sanitize(params));
      },
      get(...params) {
        return stmt.get(...sanitize(params));
      },
      all(...params) {
        return stmt.all(...sanitize(params));
      }
    };
  }
};

// Initialize database schema
export async function initDB() {
  if (process.env.DATABASE_URL) {
    return await initPgDB();
  }
  // 0. Master Schools Catalog Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS master_schools (
      id TEXT PRIMARY KEY,
      school_name TEXT NOT NULL,
      district TEXT NOT NULL,
      block_or_cluster TEXT,
      zone TEXT,
      board TEXT,
      area TEXT,
      student_strength INTEGER,
      contact_person TEXT,
      phone TEXT,
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_master_schools_district ON master_schools(district);
    CREATE INDEX IF NOT EXISTS idx_master_schools_name ON master_schools(school_name);
  `);
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
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, DELETED, INACTIVE
      requires_password_reset INTEGER DEFAULT 0,
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
    if (!colNames.includes('requires_password_reset')) {
      db.exec(`ALTER TABLE users ADD COLUMN requires_password_reset INTEGER DEFAULT 0;`);
    }
    if (!colNames.includes('updated_at')) {
      db.exec(`ALTER TABLE users ADD COLUMN updated_at DATETIME;`);
    }

    // Auto-migrate usernames from @canvasser to @cvs
    db.exec(`
      UPDATE users 
      SET username = REPLACE(username, '@canvasser', '@cvs')
      WHERE username LIKE '%@canvasser';
      UPDATE users 
      SET username = REPLACE(username, '@adminexec', '@admin')
      WHERE username LIKE '%@adminexec';
    `);
  } catch (e) {
    console.warn("User migration check:", e.message);
  }

  // 2. PendingUserActions Table (For CEO Approval Queue)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_user_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,          -- CREATE, ROLE_CHANGE, DELETE, PAUSE, RESUME
      target_user_id INTEGER,             -- NULL for CREATE, User ID for other actions
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
      discovery_status TEXT DEFAULT 'NOT_APPLICABLE', -- PENDING_VERIFICATION, VERIFIED_NEW, LINKED_EXISTING, NOT_APPLICABLE
      discovery_bonus_awarded INTEGER DEFAULT 0,
      discovery_bonus_amount REAL DEFAULT 0,
      verified_by_id INTEGER,
      verified_by_name TEXT,
      verified_at DATETIME,
      verification_notes TEXT,
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
      action TEXT NOT NULL,            -- CREATE, UPDATE, DELETE, VERIFY_DISCOVERY
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
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (canvasser_id) REFERENCES users(id)
    );
  `);

  // 6b. Proforma Invoices Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS proforma_invoices (
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
      status TEXT DEFAULT 'Pending',
      payment_status TEXT DEFAULT 'Unpaid',
      due_date TEXT,
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (canvasser_id) REFERENCES users(id)
    );
  `);

  // 7. Invoices Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      quotation_id TEXT,
      proforma_id TEXT,
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
      tags TEXT DEFAULT '[]',
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
      notes TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );
  `);

  // Auto-migration for existing SQLite tables
  try {
    const qInfo = db.prepare("PRAGMA table_info(quotations)").all().map(c => c.name);
    if (!qInfo.includes('tags')) db.exec("ALTER TABLE quotations ADD COLUMN tags TEXT DEFAULT '[]';");

    const profInfo = db.prepare("PRAGMA table_info(proforma_invoices)").all().map(c => c.name);
    if (!profInfo.includes('tags')) db.exec("ALTER TABLE proforma_invoices ADD COLUMN tags TEXT DEFAULT '[]';");

    const invInfo = db.prepare("PRAGMA table_info(invoices)").all().map(c => c.name);
    if (!invInfo.includes('tags')) db.exec("ALTER TABLE invoices ADD COLUMN tags TEXT DEFAULT '[]';");
    if (!invInfo.includes('proforma_id')) db.exec("ALTER TABLE invoices ADD COLUMN proforma_id TEXT;");

    const payInfo = db.prepare("PRAGMA table_info(payments)").all().map(c => c.name);
    if (!payInfo.includes('notes')) db.exec("ALTER TABLE payments ADD COLUMN notes TEXT;");
    if (!payInfo.includes('tags')) db.exec("ALTER TABLE payments ADD COLUMN tags TEXT DEFAULT '[]';");
  } catch (e) {
    // Migration check silent fallback
  }

  // Auto-migration for existing SQLite visits table
  const visitCols = [
    { name: 'discovery_status', type: "TEXT DEFAULT 'NOT_APPLICABLE'" },
    { name: 'discovery_bonus_awarded', type: "INTEGER DEFAULT 0" },
    { name: 'discovery_bonus_amount', type: "REAL DEFAULT 0" },
    { name: 'verified_by_id', type: "INTEGER" },
    { name: 'verified_by_name', type: "TEXT" },
    { name: 'verified_at', type: "DATETIME" },
    { name: 'verification_notes', type: "TEXT" }
  ];

  for (const col of visitCols) {
    try {
      db.exec(`ALTER TABLE visits ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      // Column already exists
    }
  }

  seedDefaultData();
  try {
    await seedRefrensData(db);
  } catch (refrensErr) {
    console.error('Error seeding Refrens records:', refrensErr);
  }

  // Ensure Refrens Import tag is present on all imported records (id LIKE 'A%')
  try {
    for (const tbl of ['quotations', 'proforma_invoices', 'invoices', 'payments']) {
      const rows = db.prepare(`SELECT id, tags FROM ${tbl} WHERE id LIKE 'A%'`).all();
      for (const r of (rows || [])) {
        let tags = [];
        try { tags = typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : (r.tags || []); } catch (_) { tags = []; }
        if (!tags.includes('Refrens Import')) {
          tags.push('Refrens Import');
          db.prepare(`UPDATE ${tbl} SET tags = ? WHERE id = ?`).run(JSON.stringify(tags), r.id);
        }
      }
    }
  } catch (tagSyncErr) {
    console.warn('Note: Refrens Import tag synchronization:', tagSyncErr.message);
  }
}

function seedDefaultData() {
  const defaultPasswordHash = bcrypt.hashSync('password', 10);

  // 1. Purge legacy soft-deleted user records so they are completely erased from the database
  try {
    db.exec("DELETE FROM users WHERE status = 'DELETED'");
    db.exec("DELETE FROM pending_user_actions WHERE target_user_id NOT IN (SELECT id FROM users)");
  } catch (err) {
    console.warn("Could not clean up legacy deleted users in SQLite:", err.message);
  }

  // 2. Check if users table already has data
  const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const userCount = Number(userCountRow ? userCountRow.count : 0);

  if (userCount === 0) {
    // Only seed initial users if database is brand new and completely empty
    const seedUsers = [
      { id: 10, username: 'sudhan@ceo', email: 'sudhan@murugan.com', name: 'Sudhan', role: 'ceo', role_title: 'Chief Executive Officer' },
      { id: 11, username: 'abhishek@cfo', email: 'abhishek@murugan.com', name: 'Abhishek', role: 'cfo', role_title: 'Chief Financial Officer' },
      { id: 12, username: 'varshini@cco', email: 'varshini@murugan.com', name: 'Varshini', role: 'cco', role_title: 'Chief Coordinating Officer' },
      { id: 4, username: 'admin@admin', email: 'admin@murugan.com', name: 'Admin', role: 'admin', role_title: 'Admin Executive' },
      { id: 1, username: 'gokul@cvs', email: 'gokul@murugan.com', name: 'Gokul', role: 'cvs', role_title: 'Senior Canvasser' }
    ];

    for (const u of seedUsers) {
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, name, role, role_title, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(u.id, u.username, u.email, defaultPasswordHash, u.name, u.role, u.role_title);
    }
  } else {
    // Ensure essential management accounts exist if missing
    const essentialUsers = [
      { id: 10, username: 'sudhan@ceo', email: 'sudhan@murugan.com', name: 'Sudhan', role: 'ceo', role_title: 'Chief Executive Officer' },
      { id: 4, username: 'admin@admin', email: 'admin@murugan.com', name: 'Admin', role: 'admin', role_title: 'Admin Executive' }
    ];
    for (const u of essentialUsers) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username);
      if (!existing) {
        db.prepare(`
          INSERT INTO users (id, username, email, password_hash, name, role, role_title, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        `).run(u.id, u.username, u.email, defaultPasswordHash, u.name, u.role, u.role_title);
      }
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

  // Seed Initial Quotations
  const quoteCount = db.prepare('SELECT COUNT(*) as count FROM quotations').get().count;
  if (quoteCount === 0) {
    const insertQuote = db.prepare(`
      INSERT INTO quotations (
        id, visit_id, canvasser_id, canvasser_name, school_name,
        district, contact_person, phone, items, subtotal,
        tax_amount, discount_amount, grand_total, status, tags, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const quotes = [
      {
        id: 'A00001',
        visit_id: 1,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        school_name: 'MARUTHAM MATRIC HIGHER SECONDARY SCHOOL',
        district: 'Madurai',
        contact_person: 'Mr. Marutham (Principal)',
        phone: '9876543210',
        items: JSON.stringify([
          { name: 'Socks (Combed Cotton)', quantity: 1, unit_rate: 60, gst_rate: 5, amount: 60, total: 63 }
        ]),
        subtotal: 60.00,
        tax_amount: 3.00,
        discount_amount: 0,
        grand_total: 63.00,
        status: 'Draft',
        tags: JSON.stringify(['Retail Sample']),
        created_at: '2026-05-11T10:00:00.000Z'
      },
      {
        id: 'A00002',
        visit_id: 2,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        school_name: 'MARUTHAM MATRIC HIGHER SECONDARY SCHOOL',
        district: 'Madurai',
        contact_person: 'Mr. Marutham',
        phone: '9876543210',
        items: JSON.stringify([
          { name: 'School Uniform Sets (Navy Blue)', quantity: 450, unit_rate: 400, gst_rate: 5, amount: 180000, total: 177300 }
        ]),
        subtotal: 197000.00,
        tax_amount: 8850.00,
        discount_amount: 28550.00,
        grand_total: 177300.00,
        status: 'Quotation Sent',
        tags: JSON.stringify(['Annual Uniform']),
        created_at: '2026-05-18T11:30:00.000Z'
      },
      {
        id: 'A00003',
        visit_id: null,
        canvasser_id: 2,
        canvasser_name: 'Murugan',
        school_name: 'Sri Soolai Vinayagar Vidyalaya',
        district: 'Coimbatore',
        contact_person: 'Correspondent Office',
        phone: '9876543212',
        items: JSON.stringify([
          { name: 'Custom School Ties', quantity: 550, unit_rate: 42.27, gst_rate: 5, amount: 23250, total: 24413 }
        ]),
        subtotal: 23250.00,
        tax_amount: 1163.00,
        discount_amount: 0,
        grand_total: 24413.00,
        status: 'Quotation Seen',
        tags: JSON.stringify(['Accessories']),
        created_at: '2026-05-20T09:15:00.000Z'
      },
      {
        id: 'A00004',
        visit_id: null,
        canvasser_id: 2,
        canvasser_name: 'Murugan',
        school_name: 'Sri Soolai Vinayagar Vidyalaya',
        district: 'Coimbatore',
        contact_person: 'Correspondent Office',
        phone: '9876543212',
        items: JSON.stringify([
          { name: 'Sample Belts with Metal Crest', quantity: 20, unit_rate: 49.4, gst_rate: 5, amount: 988, total: 1037.48 }
        ]),
        subtotal: 988.00,
        tax_amount: 49.48,
        discount_amount: 0,
        grand_total: 1037.48,
        status: 'Quotation Sent',
        tags: JSON.stringify(['Samples']),
        created_at: '2026-05-26T14:20:00.000Z'
      },
      {
        id: 'A00005',
        visit_id: null,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        school_name: 'SHALOM MATRIC HR SEC SCHOOL',
        district: 'Tirupur',
        contact_person: 'Principal Fr. David',
        phone: '9876543213',
        items: JSON.stringify([
          { name: 'Sports Shoes (Non-marking Rubber Sole)', quantity: 35, unit_rate: 343.14, gst_rate: 5, amount: 12010, total: 12610.5 }
        ]),
        subtotal: 12010.00,
        tax_amount: 600.50,
        discount_amount: 0,
        grand_total: 12610.50,
        status: 'Quotation Seen',
        tags: JSON.stringify(['Footwear']),
        created_at: '2026-05-27T16:45:00.000Z'
      },
      {
        id: 'A00006',
        visit_id: null,
        canvasser_id: 2,
        canvasser_name: 'Murugan',
        school_name: 'Sri Soolai Vinayagar Vidyalaya',
        district: 'Coimbatore',
        contact_person: 'Correspondent Office',
        phone: '9876543212',
        items: JSON.stringify([
          { name: 'Track Pants with Side Stripes', quantity: 95, unit_rate: 206.31, gst_rate: 5, amount: 19600, total: 19980 }
        ]),
        subtotal: 19600.00,
        tax_amount: 380.00,
        discount_amount: 0,
        grand_total: 19980.00,
        status: 'Quotation Seen',
        tags: JSON.stringify(['Sportswear']),
        created_at: '2026-05-30T11:00:00.000Z'
      },
      {
        id: 'A00007',
        visit_id: null,
        canvasser_id: 3,
        canvasser_name: 'Suhas',
        school_name: 'KAMP MEERANIA HSS KALAKAD',
        district: 'Tirunelveli',
        contact_person: 'Mr. Meeran (Admin)',
        phone: '9876543214',
        items: JSON.stringify([
          { name: 'School Backpack / College Bags', quantity: 80, unit_rate: 307.2, gst_rate: 5, amount: 24576, total: 24605.34 }
        ]),
        subtotal: 24576.00,
        tax_amount: 29.34,
        discount_amount: 0,
        grand_total: 24605.34,
        status: 'Quotation Seen',
        tags: JSON.stringify(['Bags']),
        created_at: '2026-06-08T15:30:00.000Z'
      },
      {
        id: 'A00008',
        visit_id: null,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        school_name: 'SHALOM MATRIC HR SEC SCHOOL',
        district: 'Tirupur',
        contact_person: 'Principal Fr. David',
        phone: '9876543213',
        items: JSON.stringify([
          { name: 'Combed Cotton Twin Stripe Socks', quantity: 450, unit_rate: 39.05, gst_rate: 5, amount: 17572, total: 18750.62 }
        ]),
        subtotal: 17572.00,
        tax_amount: 1178.62,
        discount_amount: 0,
        grand_total: 18750.62,
        status: 'Quotation Seen',
        tags: JSON.stringify(['Hosiery']),
        created_at: '2026-06-18T10:20:00.000Z'
      },
      {
        id: 'A00009',
        visit_id: null,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        school_name: 'SRI NALLAMANI YADAVA GROUP OF INSTITUTIONS',
        district: 'Tenkasi',
        contact_person: 'Dr. Nallamani (Chairman)',
        phone: '9876543215',
        items: JSON.stringify([
          { name: 'Institutional Uniform Sets + Ties', quantity: 260, unit_rate: 390.13, gst_rate: 5, amount: 101435, total: 109806.98 }
        ]),
        subtotal: 101435.00,
        tax_amount: 8371.98,
        discount_amount: 0,
        grand_total: 109806.98,
        status: 'Quotation Seen',
        tags: JSON.stringify(['Institution Group']),
        created_at: '2026-07-17T09:40:00.000Z'
      },
      {
        id: 'A00010',
        visit_id: null,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        school_name: 'SRI NALLAMANI YADAVA GROUP OF INSTITUTIONS',
        district: 'Tenkasi',
        contact_person: 'Dr. Nallamani (Chairman)',
        phone: '9876543215',
        items: JSON.stringify([
          { name: 'Sports Track Pants & Belts Bundle', quantity: 120, unit_rate: 246.0, gst_rate: 5, amount: 29520, total: 31996 }
        ]),
        subtotal: 29520.00,
        tax_amount: 2476.00,
        discount_amount: 0,
        grand_total: 31996.00,
        status: 'Quotation Seen',
        tags: JSON.stringify(['Institution Group']),
        created_at: '2026-07-17T12:00:00.000Z'
      }
    ];

    for (const q of quotes) {
      insertQuote.run(
        q.id, q.visit_id, q.canvasser_id, q.canvasser_name, q.school_name,
        q.district, q.contact_person, q.phone, q.items, q.subtotal,
        q.tax_amount, q.discount_amount, q.grand_total, q.status, q.tags, q.created_at
      );
    }
  }

  // Seed Initial Proforma Invoices
  const proformaCount = db.prepare('SELECT COUNT(*) as count FROM proforma_invoices').get().count;
  if (proformaCount === 0) {
    const insertProforma = db.prepare(`
      INSERT INTO proforma_invoices (
        id, quotation_id, visit_id, canvasser_id, canvasser_name,
        school_name, district, contact_person, phone, items,
        subtotal, tax_amount, discount_amount, grand_total,
        status, payment_status, due_date, tags, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const proformas = [
      {
        id: 'A00001',
        quotation_id: null,
        visit_id: null,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        school_name: 'VELS VISION AT ACADEMY',
        district: 'Chennai',
        contact_person: 'Mr. Sundar (Director)',
        phone: '9876543216',
        items: JSON.stringify([
          { name: 'Institutional School Uniform Full Sets', quantity: 500, unit_rate: 476.1, gst_rate: 5, amount: 238050, total: 245000 }
        ]),
        subtotal: 238050.00,
        tax_amount: 6950.00,
        discount_amount: 0,
        grand_total: 245000.00,
        status: 'Paid',
        payment_status: 'Paid',
        due_date: '2026-06-07',
        tags: JSON.stringify(['Advance Invoicing']),
        created_at: '2026-05-31T10:00:00.000Z'
      },
      {
        id: 'A00002',
        quotation_id: null,
        visit_id: null,
        canvasser_id: 2,
        canvasser_name: 'Murugan',
        school_name: 'PIONEER CBSE SCHOOL',
        district: 'Coimbatore',
        contact_person: 'Administrative Officer',
        phone: '9876543217',
        items: JSON.stringify([
          { name: 'Customized Crest Ties & Belts', quantity: 100, unit_rate: 48.6, gst_rate: 5, amount: 4860, total: 5303 }
        ]),
        subtotal: 4860.00,
        tax_amount: 443.00,
        discount_amount: 0,
        grand_total: 5303.00,
        status: 'Overdue',
        payment_status: 'Unpaid',
        due_date: '2026-06-24',
        tags: JSON.stringify(['CBSE']),
        created_at: '2026-06-09T14:15:00.000Z'
      },
      {
        id: 'A00003',
        quotation_id: 'A00010',
        visit_id: null,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        school_name: 'SRI NALLAMANI YADAVA GROUP OF INSTITUTIONS',
        district: 'Tenkasi',
        contact_person: 'Dr. Nallamani (Chairman)',
        phone: '9876543215',
        items: JSON.stringify([
          { name: 'Institutional Sports Apparel & Sock Kits', quantity: 380, unit_rate: 391.85, gst_rate: 5, amount: 148905, total: 160351 }
        ]),
        subtotal: 148905.00,
        tax_amount: 11446.00,
        discount_amount: 0,
        grand_total: 160351.00,
        status: 'Overdue',
        payment_status: 'Unpaid',
        due_date: '2026-09-08',
        tags: JSON.stringify(['High Priority']),
        created_at: '2026-08-24T11:30:00.000Z'
      }
    ];

    for (const p of proformas) {
      insertProforma.run(
        p.id, p.quotation_id, p.visit_id, p.canvasser_id, p.canvasser_name,
        p.school_name, p.district, p.contact_person, p.phone, p.items,
        p.subtotal, p.tax_amount, p.discount_amount, p.grand_total,
        p.status, p.payment_status, p.due_date, p.tags, p.created_at
      );
    }
  }

  // Seed Initial Invoices & Payments
  const invoiceCount = db.prepare('SELECT COUNT(*) as count FROM invoices').get().count;
  if (invoiceCount === 0) {
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        id, quotation_id, proforma_id, visit_id, canvasser_id, canvasser_name,
        school_name, district, contact_person, phone, items,
        subtotal, tax_amount, discount_amount, grand_total,
        paid_amount, outstanding_balance, payment_status, due_date, tags, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPayment = db.prepare(`
      INSERT INTO payments (
        id, invoice_id, school_name, amount, payment_method,
        reference_number, recorded_by_name, recorded_by_role, notes, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const invoices = [
      {
        id: 'A00001',
        quotation_id: null,
        proforma_id: null,
        visit_id: 3,
        canvasser_id: 2,
        canvasser_name: 'Murugan',
        school_name: 'PSG Public Matriculation School',
        district: 'Coimbatore',
        contact_person: 'Dr. Kavin (Correspondent)',
        phone: '9876543212',
        items: JSON.stringify([
          { id: 5, name: 'Sports Shoes (Non-marking Rubber Sole)', category: 'Footwear', quantity: 2000, unit_price: 360, unit: 'pair', discount_pct: 5, gst_rate: 18, total: 807120 },
          { id: 7, name: 'Track Pants with Side Stripes', category: 'Sportswear', quantity: 2000, unit_price: 210, unit: 'pcs', discount_pct: 5, gst_rate: 18, total: 470820 }
        ]),
        subtotal: 1083000,
        tax_amount: 194940,
        discount_amount: 57000,
        grand_total: 1277940,
        paid_amount: 500000,
        outstanding_balance: 777940,
        payment_status: 'Partially Paid',
        due_date: new Date(now + 86400000 * 15).toISOString().split('T')[0],
        tags: JSON.stringify(['Direct Order']),
        created_at: new Date(now - 86400000 * 5).toISOString(),
        payment: {
          id: 'A00001',
          amount: 500000,
          payment_method: 'Bank Transfer (NEFT)',
          reference_number: 'UTIBR5202608149872',
          recorded_at: new Date(now - 86400000 * 3).toISOString()
        }
      },
      {
        id: 'A00002',
        quotation_id: null,
        proforma_id: null,
        visit_id: null,
        canvasser_id: 1,
        canvasser_name: 'Gokul',
        school_name: 'Holy Cross Girls Higher Secondary',
        district: 'Tirupur',
        contact_person: 'Sr. Mary (Headmistress)',
        phone: '9876543213',
        items: JSON.stringify([
          { id: 1, name: 'Socks (Cotton Combed)', category: 'Hosiery', quantity: 1500, unit_price: 38, unit: 'pair', discount_pct: 0, gst_rate: 18, total: 67260 },
          { id: 2, name: 'School Uniform (Shirt + Trouser/Skirt)', category: 'Apparel', quantity: 250, unit_price: 480, unit: 'set', discount_pct: 0, gst_rate: 18, total: 141600 }
        ]),
        subtotal: 177000,
        tax_amount: 31860,
        discount_amount: 0,
        grand_total: 208860,
        paid_amount: 208860,
        outstanding_balance: 0,
        payment_status: 'Fully Paid',
        due_date: new Date(now - 86400000 * 2).toISOString().split('T')[0],
        tags: JSON.stringify(['Repeat Client']),
        created_at: new Date(now - 86400000 * 8).toISOString(),
        payment: {
          id: 'A00002',
          amount: 208860,
          payment_method: 'UPI (GPay)',
          reference_number: 'UPI/62391098234',
          recorded_at: new Date(now - 86400000 * 1).toISOString()
        }
      },
      {
        id: 'A00003',
        quotation_id: null,
        proforma_id: null,
        visit_id: null,
        canvasser_id: 3,
        canvasser_name: 'Suhas',
        school_name: 'Kongu Vellalar Matric School',
        district: 'Salem',
        contact_person: 'Mr. Saravanan',
        phone: '9876543214',
        items: JSON.stringify([
          { id: 2, name: 'School Uniform (Shirt + Trouser/Skirt)', category: 'Apparel', quantity: 600, unit_price: 480, unit: 'set', discount_pct: 5, gst_rate: 18, total: 322848 }
        ]),
        subtotal: 273600,
        tax_amount: 49248,
        discount_amount: 14400,
        grand_total: 322848,
        paid_amount: 100000,
        outstanding_balance: 222848,
        payment_status: 'Partially Paid',
        due_date: new Date(now + 86400000 * 7).toISOString().split('T')[0],
        tags: JSON.stringify(['Institutional']),
        created_at: new Date(now - 86400000 * 1).toISOString(),
        payment: {
          id: 'A00003',
          amount: 100000,
          payment_method: 'Cheque',
          reference_number: 'CHQ-882910',
          recorded_at: new Date(now - 86400000 * 1).toISOString()
        }
      }
    ];

    for (const inv of invoices) {
      insertInvoice.run(
        inv.id, inv.quotation_id, inv.proforma_id, inv.visit_id, inv.canvasser_id, inv.canvasser_name,
        inv.school_name, inv.district, inv.contact_person, inv.phone, inv.items,
        inv.subtotal, inv.tax_amount, inv.discount_amount, inv.grand_total,
        inv.paid_amount, inv.outstanding_balance, inv.payment_status, inv.due_date, inv.tags, inv.created_at
      );

      if (inv.payment) {
        insertPayment.run(
          inv.payment.id,
          inv.id,
          inv.school_name,
          inv.payment.amount,
          inv.payment.payment_method,
          inv.payment.reference_number,
          'Sudhan (CEO)',
          'Management',
          'Initial advance payment recorded',
          inv.payment.recorded_at
        );
      }
    }
  }

  // Seed Master Schools from CSVs
  try {
    const schoolCount = db.prepare('SELECT COUNT(*) as count FROM master_schools').get().count;
    if (schoolCount < 2000) {
      console.log('🔄 Loading master school catalog into SQLite database...');
      const parsedSchools = loadAndParseSchoolsFromCSVs();
      const insertSchool = db.prepare(`
        INSERT OR REPLACE INTO master_schools 
        (id, school_name, district, block_or_cluster, zone, board, area, student_strength, contact_person, phone, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `);

      for (const s of parsedSchools) {
        insertSchool.run(
          s.id,
          s.school_name,
          s.district,
          s.block_or_cluster,
          s.zone,
          s.board,
          s.area,
          s.student_strength,
          s.contact_person,
          s.phone,
          s.priority
        );
      }
      console.log(`✅ Loaded ${parsedSchools.length} master schools into SQLite canvas.db!`);
    }
  } catch (err) {
    console.warn('Error seeding master schools:', err.message);
  }
}

function getFYCode(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const year = validDate.getFullYear();
  const month = validDate.getMonth(); // 0 = Jan ... 3 = Apr
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
}

export function normalizeFinancialRecords() {
  try {
    // 1. Resequence quotations to ME-QTN-YY-YY/0001
    const quotes = db.prepare('SELECT id, created_at FROM quotations ORDER BY created_at ASC, id ASC').all();
    if (quotes && quotes.some(q => !q.id.startsWith('ME-QTN-'))) {
      const qCounters = {};
      const qMap = [];
      quotes.forEach(q => {
        const fy = getFYCode(q.created_at);
        qCounters[fy] = (qCounters[fy] || 0) + 1;
        const targetId = `ME-QTN-${fy}/${String(qCounters[fy]).padStart(4, '0')}`;
        if (q.id !== targetId) qMap.push({ oldId: q.id, newId: targetId });
      });
      for (const m of qMap) {
        const tmp = `__TMP_${m.newId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random()}`;
        db.prepare('UPDATE quotations SET id = ? WHERE id = ?').run(tmp, m.oldId);
        m.tmp = tmp;
      }
      for (const m of qMap) {
        db.prepare('UPDATE quotations SET id = ? WHERE id = ?').run(m.newId, m.tmp);
        try { db.prepare('UPDATE proforma_invoices SET quotation_id = ? WHERE quotation_id = ?').run(m.newId, m.oldId); } catch (_) { }
        try { db.prepare('UPDATE invoices SET quotation_id = ? WHERE quotation_id = ?').run(m.newId, m.oldId); } catch (_) { }
      }
    }

    // 2. Resequence proforma invoices to ME-PR-INV-YY-YY/0001
    const proformas = db.prepare('SELECT id, created_at FROM proforma_invoices ORDER BY created_at ASC, id ASC').all();
    if (proformas && proformas.some(p => !p.id.startsWith('ME-PR-INV-'))) {
      const pCounters = {};
      const pMap = [];
      proformas.forEach(p => {
        const fy = getFYCode(p.created_at);
        pCounters[fy] = (pCounters[fy] || 0) + 1;
        const targetId = `ME-PR-INV-${fy}/${String(pCounters[fy]).padStart(4, '0')}`;
        if (p.id !== targetId) pMap.push({ oldId: p.id, newId: targetId });
      });
      for (const m of pMap) {
        const tmp = `__TMP_${m.newId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random()}`;
        db.prepare('UPDATE proforma_invoices SET id = ? WHERE id = ?').run(tmp, m.oldId);
        m.tmp = tmp;
      }
      for (const m of pMap) {
        db.prepare('UPDATE proforma_invoices SET id = ? WHERE id = ?').run(m.newId, m.tmp);
        try { db.prepare('UPDATE invoices SET proforma_id = ? WHERE proforma_id = ?').run(m.newId, m.oldId); } catch (_) { }
      }
    }

    // 3. Resequence invoices to ME-TX-INV-YY-YY/0001
    const invoices = db.prepare('SELECT id, created_at FROM invoices ORDER BY created_at ASC, id ASC').all();
    if (invoices && invoices.some(i => !i.id.startsWith('ME-TX-INV-'))) {
      const iCounters = {};
      const iMap = [];
      invoices.forEach(i => {
        const fy = getFYCode(i.created_at);
        iCounters[fy] = (iCounters[fy] || 0) + 1;
        const targetId = `ME-TX-INV-${fy}/${String(iCounters[fy]).padStart(4, '0')}`;
        if (i.id !== targetId) iMap.push({ oldId: i.id, newId: targetId });
      });
      for (const m of iMap) {
        const tmp = `__TMP_${m.newId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random()}`;
        db.prepare('UPDATE invoices SET id = ? WHERE id = ?').run(tmp, m.oldId);
        m.tmp = tmp;
      }
      for (const m of iMap) {
        db.prepare('UPDATE invoices SET id = ? WHERE id = ?').run(m.newId, m.tmp);
        try { db.prepare('UPDATE payments SET invoice_id = ? WHERE invoice_id = ?').run(m.newId, m.oldId); } catch (_) { }
      }
    }

    // 4. Resequence payments to ME-RCPT-YY-YY/0001
    const payments = db.prepare('SELECT id, recorded_at FROM payments ORDER BY recorded_at ASC, id ASC').all();
    if (payments && payments.some(pay => !pay.id.startsWith('ME-RCPT-'))) {
      const payCounters = {};
      const payMap = [];
      payments.forEach(pay => {
        const fy = getFYCode(pay.recorded_at);
        payCounters[fy] = (payCounters[fy] || 0) + 1;
        const targetId = `ME-RCPT-${fy}/${String(payCounters[fy]).padStart(4, '0')}`;
        if (pay.id !== targetId) payMap.push({ oldId: pay.id, newId: targetId });
      });
      for (const m of payMap) {
        const tmp = `__TMP_${m.newId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random()}`;
        db.prepare('UPDATE payments SET id = ? WHERE id = ?').run(tmp, m.oldId);
        m.tmp = tmp;
      }
      for (const m of payMap) {
        db.prepare('UPDATE payments SET id = ? WHERE id = ?').run(m.newId, m.tmp);
      }
    }
  } catch (err) {
    console.error('Error normalizing financial records:', err);
  }
}
