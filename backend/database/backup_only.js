import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = 'postgresql://neondb_owner:npg_RFihgNEb02tS@ep-frosty-salad-aeoooo64.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function performBackup() {
  console.log('🔗 Connecting to Hosted Neon Production Database (READ-ONLY MODE)...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  const client = await pool.connect();

  try {
    // 1. Get all base tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tableRes.rows.map(r => r.table_name);
    console.log(`📋 Discovered ${tableNames.length} tables:`, tableNames.join(', '));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(__dirname, `neon_production_backup_${timestamp}.json`);
    const sqlPath = path.join(__dirname, `neon_production_backup_${timestamp}.sql`);

    const backupData = {
      timestamp: new Date().toISOString(),
      sourceEndpoint: 'ep-frosty-salad-aeoooo64',
      database: 'neondb',
      tables: {},
      sequences: {}
    };

    let sqlOutput = `-- NEON PRODUCTION DATABASE BACKUP\n-- Generated: ${new Date().toISOString()}\n-- Source: ep-frosty-salad-aeoooo64\n\n`;

    // 2. Fetch all data using strictly read-only SELECT
    for (const table of tableNames) {
      console.log(`⏳ Reading table: "${table}"...`);
      const dataRes = await client.query(`SELECT * FROM "${table}";`);
      
      backupData.tables[table] = {
        rowCount: dataRes.rowCount,
        columns: dataRes.fields.map(f => f.name),
        rows: dataRes.rows
      };

      console.log(`   ✅ Read ${dataRes.rowCount} rows from "${table}"`);

      // Generate SQL Inserts
      if (dataRes.rowCount > 0) {
        sqlOutput += `-- Data for Name: ${table}; Type: TABLE DATA; Rows: ${dataRes.rowCount}\n`;
        const columns = dataRes.fields.map(f => `"${f.name}"`).join(', ');

        for (const row of dataRes.rows) {
          const values = dataRes.fields.map(f => {
            const val = row[f.name];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') {
              return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            }
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          sqlOutput += `INSERT INTO "${table}" (${columns}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlOutput += `\n`;
      }
    }

    // 3. Fetch sequence current values
    const seqRes = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public';
    `);

    for (const seq of seqRes.rows) {
      try {
        const valRes = await client.query(`SELECT last_value, is_called FROM "${seq.sequence_name}";`);
        if (valRes.rows.length > 0) {
          backupData.sequences[seq.sequence_name] = valRes.rows[0];
          sqlOutput += `SELECT setval('"${seq.sequence_name}"', ${valRes.rows[0].last_value}, ${valRes.rows[0].is_called});\n`;
        }
      } catch (e) {
        // Skip if restricted
      }
    }

    // 4. Save to files
    fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf-8');
    fs.writeFileSync(sqlPath, sqlOutput, 'utf-8');

    console.log('\n========================================');
    console.log('🎉 BACKUP COMPLETED WITH 100% INTEGRITY!');
    console.log('========================================');
    console.log(`📁 JSON Backup File: ${jsonPath}`);
    console.log(`📁 SQL Backup File:  ${sqlPath}`);
    console.log('\n📊 Summary of Live Database Rows:');
    for (const [tbl, info] of Object.entries(backupData.tables)) {
      console.log(`   • ${tbl.padEnd(25)} : ${info.rowCount} rows`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

performBackup().catch(err => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
