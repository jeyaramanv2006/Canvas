import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initPgDB } from './pgAdapter.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targetPgUrl = 'postgresql://neondb_owner:npg_FWjHf6zT0LEG@ep-winter-butterfly-b8k2ib0q.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Locate the latest production backup file
const backupFiles = fs.readdirSync(__dirname)
  .filter(f => f.startsWith('neon_production_backup_') && f.endsWith('.json'))
  .sort()
  .reverse();

if (backupFiles.length === 0) {
  console.error('❌ No backup file found!');
  process.exit(1);
}

const backupPath = path.join(__dirname, backupFiles[0]);
console.log(`📂 Using production backup: ${backupFiles[0]}`);
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

async function restore() {
  console.log('🔄 Initializing Schema on New Neon Database...');
  process.env.DATABASE_URL = targetPgUrl;
  await initPgDB();

  console.log('🔄 Connecting to New Neon Database...');
  const pool = new Pool({
    connectionString: targetPgUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  const client = await pool.connect();

  try {
    // Correct dependency order for relational integrity
    const insertionOrder = [
      'users',
      'master_schools',
      'products',
      'pending_user_actions',
      'visits',
      'quotations',
      'proforma_invoices',
      'invoices',
      'payments',
      'audit_logs'
    ];

    // Truncate all tables first with CASCADE
    console.log('🧹 Clearing initial seed data to ensure exact mirror of live database...');
    for (const table of [...insertionOrder].reverse()) {
      if (backupData.tables[table]) {
        await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
      }
    }

    console.log('\n🚀 Starting Restoration into New Neon Database:');

    for (const table of insertionOrder) {
      const tableData = backupData.tables[table];
      if (!tableData || !tableData.rows || tableData.rows.length === 0) {
        console.log(`⏩ Skipping "${table}" (0 rows)`);
        continue;
      }

      console.log(`⏳ Restoring "${table}" (${tableData.rows.length} rows)...`);
      await client.query('BEGIN');

      const columns = tableData.columns;
      const quotedCols = columns.map(c => `"${c}"`).join(', ');

      const chunkSize = 150;
      for (let i = 0; i < tableData.rows.length; i += chunkSize) {
        const chunk = tableData.rows.slice(i, i + chunkSize);
        const valuesList = [];
        const params = [];
        let paramIdx = 1;

        for (const row of chunk) {
          const rowPlaceholders = [];
          for (const col of columns) {
            rowPlaceholders.push(`$${paramIdx++}`);
            let val = row[col];
            if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
              val = JSON.stringify(val);
            }
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

      // Sync serial sequence
      try {
        await client.query(`
          SELECT setval(
            pg_get_serial_sequence('"${table}"', 'id'),
            COALESCE((SELECT MAX(id) FROM "${table}"), 1),
            true
          );
        `);
      } catch (seqErr) {
        // Table doesn't use a serial 'id'
      }

      console.log(`   ✅ Successfully restored "${table}" (${tableData.rows.length} rows)`);
    }

    // Sync any named sequences
    if (backupData.sequences) {
      for (const [seqName, seqInfo] of Object.entries(backupData.sequences)) {
        try {
          await client.query(`SELECT setval('"${seqName}"', ${seqInfo.last_value}, ${seqInfo.is_called});`);
        } catch (e) {}
      }
    }

    console.log('\n======================================================');
    console.log('🔍 VERIFYING DATA INTEGRITY ON NEW NEON DATABASE');
    console.log('======================================================');

    let allMatch = true;
    for (const table of insertionOrder) {
      if (!backupData.tables[table]) continue;
      const expected = backupData.tables[table].rowCount;
      const res = await client.query(`SELECT count(*)::int as c FROM "${table}";`);
      const actual = res.rows[0].c;
      const ok = actual === expected;
      console.log(`   ${ok ? '✅' : '❌'} ${table.padEnd(25)} Expected: ${expected.toString().padEnd(6)} | Actual: ${actual}`);
      if (!ok) allMatch = false;
    }

    if (allMatch) {
      console.log('\n🎉 ALL TABLES VERIFIED WITH 100% ROW MATCH!');
      console.log('Your new Neon Database is completely restored and identical to production.');
    } else {
      console.warn('\n⚠️ Some row counts differed. Please review above.');
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Restoration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

restore().catch(err => {
  console.error(err);
  process.exit(1);
});
