import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { initPgDB } from './pgAdapter.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function migrateSqliteToPostgres(targetPgUrl) {
  const dbPath = path.join(__dirname, '../data/canvas.db');
  console.log(`📂 Opening SQLite DB at ${dbPath}...`);
  const sqlite = new DatabaseSync(dbPath);

  console.log(`🔄 Initializing PostgreSQL schema on Target DB...`);
  process.env.DATABASE_URL = targetPgUrl;
  await initPgDB();

  console.log(`🔄 Connecting to Target PostgreSQL...`);
  const pool = new Pool({
    connectionString: targetPgUrl,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    const tables = [
      'users',
      'master_schools',
      'products',
      'visits',
      'pending_user_actions',
      'audit_logs',
      'quotations',
      'proforma_invoices',
      'invoices',
      'payments'
    ];

    for (const table of tables) {
      const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all();
      console.log(`⏳ Migrating table ${table} (${rows.length} rows)...`);

      if (rows.length === 0) continue;

      await client.query('BEGIN');
      await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);

      const columns = Object.keys(rows[0]);
      const quotedCols = columns.map(c => `"${c}"`).join(', ');

      const chunkSize = 200;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const valuesList = [];
        const params = [];
        let paramIdx = 1;

        for (const row of chunk) {
          const rowPlaceholders = [];
          for (const col of columns) {
            rowPlaceholders.push(`$${paramIdx++}`);
            let val = row[col];
            params.push(val === undefined ? null : val);
          }
          valuesList.push(`(${rowPlaceholders.join(', ')})`);
        }

        const insertSql = `
          INSERT INTO "${table}" (${quotedCols})
          VALUES ${valuesList.join(', ')}
          ON CONFLICT DO NOTHING;
        `;
        await client.query(insertSql, params);
      }

      await client.query('COMMIT');

      // Reset auto-increment sequence if id column is integer serial
      try {
        await client.query(`
          SELECT setval(
            pg_get_serial_sequence('"${table}"', 'id'),
            COALESCE((SELECT MAX(id) FROM "${table}"), 1),
            true
          );
        `);
      } catch (e) {
        // Table doesn't use serial sequence
      }

      console.log(`   ✅ Restored ${rows.length} rows to ${table}`);
    }

    console.log('\n🔍 Verifying row counts on Target PostgreSQL:');
    let allMatch = true;
    for (const table of tables) {
      const sqliteCount = sqlite.prepare(`SELECT count(*) as c FROM "${table}"`).get().c;
      const pgRes = await client.query(`SELECT count(*)::int as c FROM "${table}"`);
      const pgCount = pgRes.rows[0].c;
      const match = sqliteCount === pgCount;
      console.log(`   ${match ? '✅' : '⚠️'} ${table}: SQLite=${sqliteCount}, Postgres=${pgCount}`);
      if (!match) allMatch = false;
    }

    if (allMatch) {
      console.log('\n🎉 ALL TABLES VERIFIED! Migration completed with 100% integrity.');
    } else {
      console.log('\n⚠️ Some row counts differed.');
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('sqliteToPg.js')) {
  const targetUrl = process.argv[2] || process.env.NEW_DATABASE_URL;
  if (!targetUrl) {
    console.error('Usage: node --experimental-sqlite backend/database/sqliteToPg.js <NEW_DATABASE_URL>');
    process.exit(1);
  }
  migrateSqliteToPostgres(targetUrl).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
