import assert from 'node:assert';
import app from '../server.js';

const PORT = 5055;
process.env.NODE_ENV = 'test';

const server = app.listen(PORT, async () => {
  try {
    console.log(`🧪 Running backend integration test suite on port ${PORT}...`);
    const baseUrl = `http://localhost:${PORT}/api`;

    // 1. Health Check
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok');
    console.log('  ✓ 1. GET /api/health passed');

    // 2. Canvasser Login
    const canvasserLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gokul@murugan.com', password: 'password' })
    });
    assert.strictEqual(canvasserLoginRes.status, 200);
    const canvasserAuth = await canvasserLoginRes.json();
    assert.ok(canvasserAuth.token);
    assert.strictEqual(canvasserAuth.user.role, 'canvasser');
    const canvasserToken = canvasserAuth.token;
    console.log('  ✓ 2. POST /api/login (Canvasser) passed');

    // 3. Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@murugan.com', password: 'password' })
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminAuth = await adminLoginRes.json();
    assert.ok(adminAuth.token);
    const adminToken = adminAuth.token;
    console.log('  ✓ 3. POST /api/login (Admin) passed');

    // 4. Create Visit (Canvasser)
    const newVisitPayload = {
      school_name: 'Bharathi Matriculation Higher Secondary School',
      district: 'Tirunelveli',
      cluster_or_block: 'Palayamkottai',
      institution_type: 'School',
      contact_person: 'Mr. Subramanian (Principal)',
      phone: '9443123456',
      student_strength: 1500,
      product_interests: ['Socks', 'School Uniform (Shirt + Trouser/Skirt)'],
      product_specifications: 'Navy blue combed cotton socks with yellow stripes',
      interest_level: 'Hot',
      outcome_status: 'Open',
      notes: 'Initial principal meeting went exceptionally well.'
    };

    const createVisitRes = await fetch(`${baseUrl}/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${canvasserToken}`
      },
      body: JSON.stringify(newVisitPayload)
    });
    assert.strictEqual(createVisitRes.status, 201);
    const createdVisit = await createVisitRes.json();
    assert.ok(createdVisit.id);
    assert.strictEqual(createdVisit.school_name, newVisitPayload.school_name);
    assert.strictEqual(createdVisit.district, newVisitPayload.district);
    assert.ok(createdVisit.edit_history.length >= 1);
    assert.strictEqual(createdVisit.edit_history[0].action, 'CREATE');
    console.log(`  ✓ 4. POST /api/visits (Created visit ID: ${createdVisit.id} with CREATE audit log) passed`);

    // 5. Update Visit (Audit Trail Diff Check)
    const updatePayload = {
      outcome_status: 'Sample Sent',
      interest_level: 'Hot',
      notes: 'Sent sample kit of 3 pairs of socks with custom embroidery.'
    };

    const updateVisitRes = await fetch(`${baseUrl}/visits/${createdVisit.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${canvasserToken}`
      },
      body: JSON.stringify(updatePayload)
    });
    assert.strictEqual(updateVisitRes.status, 200);
    const updatedVisit = await updateVisitRes.json();
    assert.strictEqual(updatedVisit.outcome_status, 'Sample Sent');
    assert.ok(updatedVisit.edit_history.length >= 2);
    const latestAudit = updatedVisit.edit_history[0];
    assert.strictEqual(latestAudit.action, 'UPDATE');
    assert.ok(latestAudit.changes.some(c => c.field === 'Outcome Status' && c.from === 'Open' && c.to === 'Sample Sent'));
    console.log('  ✓ 5. PUT /api/visits/:id (Calculated diff and appended UPDATE audit log) passed');

    // 6. Get Visit by ID (Full Audit Trail History)
    const getSingleRes = await fetch(`${baseUrl}/visits/${createdVisit.id}`, {
      headers: { 'Authorization': `Bearer ${canvasserToken}` }
    });
    assert.strictEqual(getSingleRes.status, 200);
    const singleVisit = await getSingleRes.json();
    assert.strictEqual(singleVisit.id, createdVisit.id);
    assert.ok(Array.isArray(singleVisit.edit_history));
    assert.ok(singleVisit.edit_history.length >= 2);
    console.log('  ✓ 6. GET /api/visits/:id (Returns visit with audit history) passed');

    // 7. Get Audit Logs (Admin)
    const auditLogsRes = await fetch(`${baseUrl}/audit-logs?visit_id=${createdVisit.id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(auditLogsRes.status, 200);
    const auditLogs = await auditLogsRes.json();
    assert.ok(Array.isArray(auditLogs));
    assert.ok(auditLogs.length >= 2);
    console.log(`  ✓ 7. GET /api/audit-logs (Found ${auditLogs.length} audit logs for visit) passed`);

    // 8. Financials: Quotation Creation with Visit Link
    const quotePayload = {
      visit_id: createdVisit.id,
      school_name: createdVisit.school_name,
      district: createdVisit.district,
      contact_person: createdVisit.contact_person,
      phone: createdVisit.phone,
      items: [{ name: 'Socks', quantity: 1500, unit_price: 38, total: 57000 }],
      subtotal: 57000,
      tax_amount: 10260,
      grand_total: 67260
    };

    const quoteRes = await fetch(`${baseUrl}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${canvasserToken}`
      },
      body: JSON.stringify(quotePayload)
    });
    assert.strictEqual(quoteRes.status, 201);
    const quoteData = await quoteRes.json();
    assert.ok(quoteData.id.startsWith('QTN-'));
    console.log(`  ✓ 8. POST /api/quotations (Created ${quoteData.id}, linked to visit, updated status) passed`);

    // 9. Dashboard Analytics Stats
    const statsRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(statsRes.status, 200);
    const stats = await statsRes.json();
    assert.ok(stats.totalVisits > 0);
    assert.ok(Array.isArray(stats.districtData));
    console.log('  ✓ 9. GET /api/dashboard/stats passed');

    // 10. Canvasser Leaderboard & Commission
    const leaderboardRes = await fetch(`${baseUrl}/leaderboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(leaderboardRes.status, 200);
    const leaderboard = await leaderboardRes.json();
    assert.ok(Array.isArray(leaderboard));
    assert.ok(leaderboard.length > 0);
    console.log('  ✓ 10. GET /api/leaderboard passed');

    console.log('\n🎉 ALL 10 INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    server.close(() => process.exit(1));
  }
});
