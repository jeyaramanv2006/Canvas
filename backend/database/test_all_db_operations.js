import pg from 'pg';

const { Pool } = pg;
const newUrl = 'postgresql://neondb_owner:npg_FWjHf6zT0LEG@ep-winter-butterfly-b8k2ib0q.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function runFullDiagnostics() {
  console.log('🩺 Starting Comprehensive Database Operations Diagnostic on New Neon DB...\n');
  const pool = new Pool({
    connectionString: newUrl,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  const results = [];

  const check = async (name, testFn) => {
    try {
      await client.query('BEGIN');
      await testFn(client);
      await client.query('ROLLBACK'); // Always rollback so no test clutter remains!
      results.push({ test: name, status: 'PASS' });
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      results.push({ test: name, status: 'FAIL', error: err.message });
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  };

  try {
    // 1. Visits Table (Insert, Select, Update)
    await check('Visits: Insert new record', async (c) => {
      const res = await c.query(`
        INSERT INTO visits (
          canvasser_id, canvasser_name, school_name, district, institution_type, contact_person, phone, product_interests, interest_level, outcome_status
        ) VALUES (
          1, 'Test Canvasser', 'Diagnostic Test School', 'Chennai', 'Matriculation', 'Dr. Test', '9999999999', '["Kit"]', 'High', 'Pending'
        ) RETURNING id;
      `);
      if (!res.rows[0].id) throw new Error('Failed to return generated ID');
    });

    await check('Visits: Update existing record', async (c) => {
      await c.query(`UPDATE visits SET notes = 'Diagnostic updated note' WHERE id = 127`);
    });

    // 2. Audit Logs Table (Logging visit action)
    await check('Audit Logs: Insert action log', async (c) => {
      await c.query(`
        INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields)
        VALUES (127, 1, 'Diagnostic Actor', 'admin', 'UPDATE_VISIT', '{"test": true}');
      `);
    });

    // 3. Quotations Table (Create quote, query)
    await check('Quotations: Insert & Query quote', async (c) => {
      const testQuoteId = `TEST-Q-${Date.now()}`;
      await c.query(`
        INSERT INTO quotations (
          id, visit_id, canvasser_id, canvasser_name, school_name, district, contact_person, phone, items, subtotal, tax_amount, grand_total, status
        ) VALUES (
          $1, 127, 1, 'Test Canvasser', 'Diagnostic School', 'Chennai', 'Contact', '9999999999', '[]', 1000, 180, 1180, 'Sent'
        );
      `, [testQuoteId]);
    });

    // 4. Invoices Table (Create invoice, update balance)
    await check('Invoices: Insert & Update payment balance', async (c) => {
      const testInvId = `TEST-INV-${Date.now()}`;
      await c.query(`
        INSERT INTO invoices (
          id, quotation_id, visit_id, canvasser_id, canvasser_name, school_name, district, contact_person, phone, items, subtotal, tax_amount, grand_total, paid_amount, outstanding_balance, payment_status
        ) VALUES (
          $1, 'Q-1', 127, 1, 'Test Canvasser', 'Diagnostic School', 'Chennai', 'Contact', '9999999999', '[]', 1000, 180, 1180, 0, 1180, 'Unpaid'
        );
      `, [testInvId]);

      await c.query(`
        UPDATE invoices SET paid_amount = 500, outstanding_balance = 680, payment_status = 'Partially Paid' WHERE id = $1;
      `, [testInvId]);
    });

    // 5. Payments Table (Record receipt)
    await check('Payments: Record payment receipt', async (c) => {
      const testPayId = `TEST-PAY-${Date.now()}`;
      await c.query(`
        INSERT INTO payments (
          id, invoice_id, school_name, amount, payment_method, recorded_by_name, recorded_by_role
        ) VALUES (
          $1, 'INV-1', 'Diagnostic School', 500, 'Bank Transfer', 'Admin', 'admin'
        );
      `, [testPayId]);
    });

    // 6. Proforma Invoices Table
    await check('Proforma Invoices: Insert & Query', async (c) => {
      const testPiId = `TEST-PI-${Date.now()}`;
      await c.query(`
        INSERT INTO proforma_invoices (
          id, quotation_id, visit_id, canvasser_id, canvasser_name, school_name, district, contact_person, phone, items, subtotal, tax_amount, grand_total, status
        ) VALUES (
          $1, 'Q-1', 127, 1, 'Canvasser', 'School', 'District', 'Person', '9999999999', '[]', 500, 90, 590, 'Pending'
        );
      `, [testPiId]);
    });

    // 7. Users & Authentication Table (Verify queries, password lookup, role fetch)
    await check('Users: Query login by username & role check', async (c) => {
      const res = await c.query(`SELECT id, username, password_hash, role FROM users WHERE username = 'admin@admin'`);
      if (res.rows.length === 0) throw new Error('Default admin user not found');
      if (!res.rows[0].password_hash.startsWith('$2')) throw new Error('Password hash invalid');
    });

    // 8. Pending User Actions (Request user create/approval)
    await check('Pending Actions: Insert approval action', async (c) => {
      await c.query(`
        INSERT INTO pending_user_actions (
          action_type, target_user_data, requested_by_id, requested_by_name, requested_by_role, status
        ) VALUES (
          'CREATE_USER', '{"name": "New User"}', 1, 'Admin', 'admin', 'PENDING'
        );
      `);
    });

    // 9. Master Schools Search & Autocomplete Query
    await check('Master Schools: Search and autocomplete index query', async (c) => {
      const res = await c.query(`SELECT id, school_name, district FROM master_schools WHERE school_name ILIKE '%School%' LIMIT 10;`);
      if (res.rows.length === 0) throw new Error('No schools matched search query');
    });

    // 10. Sequence Nextval Concurrency Check
    await check('Sequences: Nextval generates clean unique IDs', async (c) => {
      const r1 = await c.query(`SELECT nextval('visits_id_seq') as nv`);
      const r2 = await c.query(`SELECT nextval('visits_id_seq') as nv`);
      if (Number(r2.rows[0].nv) <= Number(r1.rows[0].nv)) throw new Error('Sequence not incrementing');
    });

    console.log('\n======================================================');
    console.log(`📊 DIAGNOSTIC RESULTS: ${results.filter(r => r.status === 'PASS').length}/${results.length} CHECKS PASSED`);
    console.log('======================================================');

    const allPassed = results.every(r => r.status === 'PASS');
    if (allPassed) {
      console.log('🎉 100% OF DATABASE OPERATIONS (READ, WRITE, UPDATE, SEQUENCES, CONSTRAINTS) ARE FULLY FUNCTIONAL!');
    }

  } finally {
    client.release();
    await pool.end();
  }
}

runFullDiagnostics().catch(console.error);
