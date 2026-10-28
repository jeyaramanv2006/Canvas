import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_FWjHf6zT0LEG@ep-winter-butterfly-b8k2ib0q.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const resBefore = await client.query('SELECT id, school_name, length(attachments) as att_len FROM visits WHERE id = 120');
    console.log('Before update:', resBefore.rows[0]);

    await client.query("UPDATE visits SET attachments = '[]' WHERE id = 120");

    const resAfter = await client.query('SELECT id, school_name, attachments FROM visits WHERE id = 120');
    console.log('After update:', resAfter.rows[0]);
    console.log('✅ Successfully cleared Visit 120 attachment.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Error updating visit 120:', err);
  process.exit(1);
});
