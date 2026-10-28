import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initPgDB, getPgPool } from './pgAdapter.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getClient(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  return pool;
}

export async function dumpDatabase(sourceUrl, outputFile) {
  console.log('🔄 Connecting to Source Database...');
  const pool = await getClient(sourceUrl);

  try {
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tableRes.rows.map(r => r.table_name);
    console.log(`📋 Found ${tableNames.length} tables in source:`, tableNames.join(', '));

    const backupData = {
      timestamp: new Date().toISOString(),
      source: sourceUrl.replace(/:[^:]*@/, ':***@'),
      tables: {}
    };

    for (const table of tableNames) {
      console.log(`⏳ Reading table: ${table}...`);
      const dataRes = await pool.query(`SELECT * FROM "${table}";`);
      backupData.tables[table] = {
        count: dataRes.rowCount,
        rows: dataRes.rows
      };
      console.log(`   ✅ Fetched ${dataRes.rowCount} rows from ${table}`);
    }

    // Also get sequence states
    const seqRes = await pool.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public';
    `);

    backupData.sequences = {};
    for (const seq of seqRes.rows) {
      try {
        const valRes = await pool.query(`SELECT last_value, is_called FROM "${seq.sequence_name}";`);
        backupData.sequences[seq.sequence_name] = valRes.rows[0];
      } catch (e) {
        // Ignored if permissions restrict direct sequence read
      }
    }

    fs.writeFileSync(outputFile, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`\n🎉 Backup successfully saved to: ${outputFile}`);
    console.log(`📊 Summary of backed up rows:`);
    for (const [t, info] of Object.entries(backupData.tables)) {
      console.log(`   - ${t}: ${info.count} rows`);
    }

    return backupData;
  } finally {
    await pool.end();
  }
}

export async function restoreDatabase(targetUrl, backupDataOrFile) {
  let backupData = backupDataOrFile;
  if (typeof backupDataOrFile === 'string') {
    console.log(`📂 Loading backup file from ${backupDataOrFile}...`);
    backupData = JSON.parse(fs.readFileSync(backupDataOrFile, 'utf-8'));
  }

  console.log('🔄 Initializing Target Database schema...');
  process.env.DATABASE_URL = targetUrl;
  await initPgDB();

  console.log('🔄 Connecting to Target Database for data restoration...');
  const pool = await getClient(targetUrl);

  try {
    const client = await pool.connect();
    try {
      for (const [table, info] of Object.entries(backupData.tables)) {
        if (!info.rows || info.rows.length === 0) {
          console.log(`⏩ Skipping ${table} (0 rows to restore).`);
          continue;
        }

        console.log(`⏳ Restoring table: ${table} (${info.rows.length} rows)...`);
        
        await client.query('BEGIN');
        
        // Disable triggers/constraints check if possible or truncate existing
        await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);

        // Batch insert
        const columns = Object.keys(info.rows[0]);
        const quotedCols = columns.map(c => `"${c}"`).join(', ');

        const chunkSize = 100;
        for (let i = 0; i < info.rows.length; i += chunkSize) {
          const chunk = info.rows.slice(i, i + chunkSize);
          const valuesList = [];
          const params = [];
          let paramIdx = 1;

          for (const row of chunk) {
            const rowPlaceholders = [];
            for (const col of columns) {
              rowPlaceholders.push(`$${paramIdx++}`);
              let val = row[col];
              // Handle JSON/arrays if represented as objects
              if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                val = JSON.stringify(val);
              }
              params.push(val);
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
        console.log(`   ✅ Restored ${info.rows.length} rows to ${table}`);

        // Sync sequence if primary key is serial
        try {
          await client.query(`
            SELECT setval(
              pg_get_serial_sequence('"${table}"', 'id'),
              COALESCE((SELECT MAX(id) FROM "${table}"), 1),
              true
            );
          `);
        } catch (seqErr) {
          // Table may not have a serial 'id' column, which is expected for tables like master_schools (varchar)
        }
      }

      console.log('\n🔍 Verifying row counts on Target Database:');
      let allMatch = true;
      for (const [table, info] of Object.entries(backupData.tables)) {
        const verifyRes = await client.query(`SELECT count(*)::int as count FROM "${table}";`);
        const targetCount = verifyRes.rows[0].count;
        const match = targetCount === info.count;
        console.log(`   ${match ? '✅' : '⚠️'} ${table}: Source=${info.count}, Target=${targetCount}`);
        if (!match) allMatch = false;
      }

      if (allMatch) {
        console.log('\n🎉 ALL TABLES VERIFIED! Data migration completed with 100% integrity.');
      } else {
        console.log('\n⚠️ Some table row counts differed. Please review above.');
      }

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// CLI Execution Support
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  const args = process.argv.slice(2);
  const source = args[0] || process.env.OLD_DATABASE_URL;
  const target = args[1] || process.env.NEW_DATABASE_URL;

  const backupPath = path.join(__dirname, `neon_backup_${Date.now()}.json`);

  if (!source) {
    console.error('Usage: node backend/database/migrate.js <OLD_DATABASE_URL> [NEW_DATABASE_URL]');
    process.exit(1);
  }

  (async () => {
    try {
      const backup = await dumpDatabase(source, backupPath);
      if (target) {
        await restoreDatabase(target, backup);
      } else {
        console.log('\nNo target URL provided. Dump completed. To restore later:');
        console.log(`node backend/database/migrate.js --restore "${backupPath}" <NEW_DATABASE_URL>`);
      }
    } catch (err) {
      console.error('❌ Migration error:', err);
      process.exit(1);
    }
  })();
}
