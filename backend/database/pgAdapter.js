import bcrypt from 'bcryptjs';
import { loadAndParseSchoolsFromCSVs } from './seedSchools.js';

let pool = null;

export async function getPgPool() {
  if (!pool && process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const { Pool } = pg;

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    pool.on('error', (err) => {
      console.error('Unexpected Supabase PostgreSQL Pool Error:', err);
    });
  }
  return pool;
}

function convertPlaceholders(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export const pgDb = {
  isPostgres: true,

  async exec(sql) {
    const p = await getPgPool();
    if (!p) throw new Error('PostgreSQL Pool not initialized. DATABASE_URL is required.');
    return await p.query(sql);
  },

  prepare(sql) {
    const convertedSql = convertPlaceholders(sql);

    return {
      async all(...params) {
        const p = await getPgPool();
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const res = await p.query(convertedSql, flatParams);
        return res.rows;
      },

      async get(...params) {
        const p = await getPgPool();
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const res = await p.query(convertedSql, flatParams);
        return res.rows[0];
      },

      async run(...params) {
        const p = await getPgPool();
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const res = await p.query(convertedSql, flatParams);
        return {
          changes: res.rowCount,
          lastInsertRowid: res.rows && res.rows[0] ? (res.rows[0].id || res.rows[0].ID) : null
        };
      }
    };
  }
};

export async function initPgDB() {
  const p = await getPgPool();
  if (!p) return;

  console.log('🔗 Connecting to Supabase PostgreSQL...');

  // Create Tables
  await p.query(`
    CREATE TABLE IF NOT EXISTS master_schools (
      id VARCHAR(100) PRIMARY KEY,
      school_name TEXT NOT NULL,
      district VARCHAR(255) NOT NULL,
      block_or_cluster VARCHAR(255),
      zone VARCHAR(255),
      board VARCHAR(100),
      area VARCHAR(255),
      student_strength INTEGER,
      contact_person VARCHAR(255),
      phone VARCHAR(100),
      priority VARCHAR(50) DEFAULT 'Medium',
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_master_schools_district ON master_schools(district);
    CREATE INDEX IF NOT EXISTS idx_master_schools_name ON master_schools(school_name);

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255),
      password_hash TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      role_title VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      requires_password_reset INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pending_user_actions (
      id SERIAL PRIMARY KEY,
      action_type VARCHAR(50) NOT NULL,
      target_user_id INTEGER,
      target_user_data TEXT NOT NULL,
      requested_by_id INTEGER NOT NULL,
      requested_by_name VARCHAR(255) NOT NULL,
      requested_by_role VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      reviewed_by_id INTEGER,
      reviewed_by_name VARCHAR(255),
      reviewed_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      canvasser_id INTEGER NOT NULL,
      canvasser_name VARCHAR(255) NOT NULL,
      is_from_master_db INTEGER DEFAULT 0,
      master_school_id VARCHAR(100),
      school_name TEXT NOT NULL,
      district VARCHAR(255) NOT NULL,
      cluster_or_block VARCHAR(255),
      institution_type VARCHAR(100) NOT NULL,
      contact_person VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      student_strength INTEGER,
      product_interests TEXT NOT NULL,
      product_specifications TEXT,
      attachments TEXT DEFAULT '[]',
      interest_level VARCHAR(50) NOT NULL,
      outcome_status VARCHAR(50) NOT NULL,
      follow_up_date VARCHAR(50),
      notes TEXT,
      last_edited_by_name VARCHAR(255),
      last_edited_by_role VARCHAR(50),
      last_edited_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      visit_id INTEGER,
      actor_id INTEGER NOT NULL,
      actor_name VARCHAR(255) NOT NULL,
      actor_role VARCHAR(50) NOT NULL,
      action VARCHAR(50) NOT NULL,
      changed_fields TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      unit_price NUMERIC NOT NULL,
      unit VARCHAR(50) NOT NULL,
      hsn VARCHAR(50) NOT NULL,
      gst_rate NUMERIC DEFAULT 18.0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id VARCHAR(100) PRIMARY KEY,
      visit_id INTEGER,
      canvasser_id INTEGER NOT NULL,
      canvasser_name VARCHAR(255) NOT NULL,
      school_name TEXT NOT NULL,
      district VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      items TEXT NOT NULL,
      subtotal NUMERIC NOT NULL,
      tax_amount NUMERIC NOT NULL,
      discount_amount NUMERIC DEFAULT 0,
      grand_total NUMERIC NOT NULL,
      status VARCHAR(50) DEFAULT 'Sent',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(100) PRIMARY KEY,
      quotation_id VARCHAR(100),
      visit_id INTEGER,
      canvasser_id INTEGER NOT NULL,
      canvasser_name VARCHAR(255) NOT NULL,
      school_name TEXT NOT NULL,
      district VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      items TEXT NOT NULL,
      subtotal NUMERIC NOT NULL,
      tax_amount NUMERIC NOT NULL,
      discount_amount NUMERIC DEFAULT 0,
      grand_total NUMERIC NOT NULL,
      paid_amount NUMERIC DEFAULT 0,
      outstanding_balance NUMERIC NOT NULL,
      payment_status VARCHAR(50) DEFAULT 'Unpaid',
      due_date VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(100) PRIMARY KEY,
      invoice_id VARCHAR(100) NOT NULL,
      school_name TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      reference_number VARCHAR(100),
      recorded_by_name VARCHAR(255) NOT NULL,
      recorded_by_role VARCHAR(50) NOT NULL,
      recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await seedPgData(p);
  console.log('✅ Supabase PostgreSQL schema initialized and verified.');
}

async function seedPgData(p) {
  const defaultPasswordHash = bcrypt.hashSync('password', 10);

  // 1. Seed Official 7 Team Members
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
    const existing = await p.query('SELECT id FROM users WHERE username = $1 OR id = $2', [u.username, u.id]);
    if (existing.rows.length === 0) {
      await p.query(
        `INSERT INTO users (id, username, email, password_hash, name, role, role_title, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role, name = EXCLUDED.name`,
        [u.id, u.username, u.email, defaultPasswordHash, u.name, u.role, u.role_title]
      );
    }
  }

  // Auto-migrate usernames from @canvasser to @cvs on PostgreSQL/Neon
  try {
    await p.query(`
      UPDATE users 
      SET username = REPLACE(username, '@canvasser', '@cvs')
      WHERE username LIKE '%@canvasser';
      UPDATE users 
      SET username = REPLACE(username, '@adminexec', '@admin')
      WHERE username LIKE '%@adminexec';
    `);
  } catch (e) {
    console.warn("PostgreSQL username migration check:", e.message);
  }

  // 2. Seed Master Schools Catalog (2,561 Schools)
  const countRes = await p.query('SELECT COUNT(*) as count FROM master_schools');
  const currentCount = parseInt(countRes.rows[0].count, 10) || 0;

  if (currentCount < 2500) {
    console.log(`📥 Seeding 2,561 Master Schools into Supabase PostgreSQL...`);
    const schools = loadAndParseSchoolsFromCSVs();
    
    const batchSize = 200;
    for (let i = 0; i < schools.length; i += batchSize) {
      const batch = schools.slice(i, i + batchSize);
      const valueStrings = [];
      const values = [];
      let valIdx = 1;

      for (const s of batch) {
        valueStrings.push(`($${valIdx}, $${valIdx+1}, $${valIdx+2}, $${valIdx+3}, $${valIdx+4}, $${valIdx+5}, $${valIdx+6}, $${valIdx+7}, $${valIdx+8}, $${valIdx+9}, $${valIdx+10}, 'ACTIVE')`);
        values.push(
          s.id,
          s.school_name,
          s.district,
          s.block_or_cluster || null,
          s.zone || null,
          s.board || null,
          s.area || null,
          s.student_strength || null,
          s.contact_person || null,
          s.phone || null,
          s.priority || 'Medium'
        );
        valIdx += 11;
      }

      if (valueStrings.length > 0) {
        const insertSql = `
          INSERT INTO master_schools (
            id, school_name, district, block_or_cluster, zone, board, area,
            student_strength, contact_person, phone, priority, status
          ) VALUES ${valueStrings.join(', ')}
          ON CONFLICT (id) DO NOTHING
        `;
        await p.query(insertSql, values);
      }
    }
    console.log(`🎉 Master Schools seeding to Supabase complete.`);
  }

  // 3. Seed Products
  const prodRes = await p.query('SELECT COUNT(*) as count FROM products');
  if (parseInt(prodRes.rows[0].count, 10) === 0) {
    const products = [
      ['Socks (Cotton Combed)', 'Hosiery', 38.00, 'pair', '611595', 18.0],
      ['School Uniform (Shirt + Trouser/Skirt)', 'Apparel', 480.00, 'set', '620342', 18.0],
      ['School Belts with Metal Crest', 'Accessories', 55.00, 'pcs', '392690', 18.0],
      ['School Tie (Sublimation Crest)', 'Accessories', 42.00, 'pcs', '621510', 18.0],
      ['Sports Shoes (Non-marking Rubber Sole)', 'Footwear', 360.00, 'pair', '640411', 18.0],
      ['School Backpack / College Bags', 'Bags', 310.00, 'pcs', '420212', 18.0],
      ['Track Pants with Side Stripes', 'Sportswear', 210.00, 'pcs', '610343', 18.0]
    ];
    for (const prod of products) {
      await p.query(
        'INSERT INTO products (name, category, unit_price, unit, hsn, gst_rate) VALUES ($1, $2, $3, $4, $5, $6)',
        prod
      );
    }
  }
}
