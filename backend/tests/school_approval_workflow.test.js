import assert from 'node:assert';
import app from '../server.js';

const PORT = 5057;
process.env.NODE_ENV = 'test';

const server = app.listen(PORT, async () => {
  try {
    console.log(`🧪 Running Master Schools Governance & Approval Workflow test suite on port ${PORT}...`);
    const baseUrl = `http://localhost:${PORT}/api`;
    const rand = Math.floor(1000 + Math.random() * 9000);

    // 1. Authenticate CEO & Admin
    const ceoRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sudhan@ceo', password: 'password' })
    });
    assert.strictEqual(ceoRes.status, 200);
    const { token: ceoToken } = await ceoRes.json();

    const adminRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@admin', password: 'password' })
    });
    assert.strictEqual(adminRes.status, 200);
    const { token: adminToken } = await adminRes.json();

    const cvsRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'gokul@cvs', password: 'password' })
    });
    assert.strictEqual(cvsRes.status, 200);
    const { token: cvsToken } = await cvsRes.json();

    console.log('  ✓ 1. CEO, Admin, Canvasser logins authenticated');

    // 2. Canvasser searches Master Schools across districts
    const searchRes = await fetch(`${baseUrl}/master-schools?q=Vidyalaya&district=Chennai`, {
      headers: { Authorization: `Bearer ${cvsToken}` }
    });
    assert.strictEqual(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.ok(searchData.schools.length > 0, 'Should find schools matching query');
    console.log(`  ✓ 2. Master School query verified (${searchData.schools.length} matches in Chennai)`);

    // 3. Admin proposes a new School creation
    const newSchoolPayload = {
      school_name: `St. Marys Excellence Academy ${rand}`,
      district: 'Tenkasi',
      block_or_cluster: 'Alangulam',
      zone: 'South Tamil Nadu',
      board: 'CBSE',
      area: 'Main Road, Alangulam',
      student_strength: 850,
      contact_person: 'Rev. Fr. Joseph',
      phone: '9842100000',
      priority: 'High'
    };

    const adminCreateRes = await fetch(`${baseUrl}/master-schools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(newSchoolPayload)
    });
    assert.strictEqual(adminCreateRes.status, 202);
    const adminCreateData = await adminCreateRes.json();
    assert.strictEqual(adminCreateData.requiresApproval, true);
    assert.ok(adminCreateData.approvalId);
    console.log(`  ✓ 3. Admin school creation queued as pending request #${adminCreateData.approvalId}`);

    // 4. CEO approves the creation request
    const approveRes = await fetch(`${baseUrl}/approvals/${adminCreateData.approvalId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ decision: 'APPROVE', notes: 'Approved by CEO Sudhan' })
    });
    assert.strictEqual(approveRes.status, 200);
    console.log(`  ✓ 4. CEO approved school creation request`);

    // 5. Verify school is now active in Master Catalog
    const verifySearch = await fetch(`${baseUrl}/master-schools?q=St.%20Marys%20Excellence%20Academy%20${rand}`, {
      headers: { Authorization: `Bearer ${cvsToken}` }
    });
    const verifyData = await verifySearch.json();
    assert.strictEqual(verifyData.schools.length, 1);
    const createdSchool = verifyData.schools[0];
    assert.strictEqual(createdSchool.district, 'Tenkasi');
    console.log(`  ✓ 5. Verified newly approved school "${createdSchool.school_name}" in SQLite master database`);

    // 6. CEO direct edit test
    const directEditRes = await fetch(`${baseUrl}/master-schools/${createdSchool.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ student_strength: 1200, priority: 'Top Priority' })
    });
    assert.strictEqual(directEditRes.status, 200);
    const directEditData = await directEditRes.json();
    assert.strictEqual(directEditData.requiresApproval, false);
    console.log(`  ✓ 6. CEO direct update executed immediately`);

    // 7. Admin deletion request queued for CEO review
    const adminDeleteRes = await fetch(`${baseUrl}/master-schools/${createdSchool.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminDeleteRes.status, 202);
    const adminDeleteData = await adminDeleteRes.json();
    assert.strictEqual(adminDeleteData.requiresApproval, true);
    console.log(`  ✓ 7. Admin school delete request #${adminDeleteData.approvalId} queued`);

    // 8. CEO approves deletion
    const approveDeleteRes = await fetch(`${baseUrl}/approvals/${adminDeleteData.approvalId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ decision: 'APPROVE', notes: 'Deleted per admin request' })
    });
    assert.strictEqual(approveDeleteRes.status, 200);

    // 9. Verify deletion from master catalog
    const checkDeletedRes = await fetch(`${baseUrl}/master-schools/${createdSchool.id}`, {
      headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert.strictEqual(checkDeletedRes.status, 404);
    console.log(`  ✓ 8. School successfully removed from SQLite catalog after CEO approval`);

    console.log('\n🎉 ALL MASTER SCHOOLS GOVERNANCE & APPROVAL WORKFLOW TESTS PASSED!\n');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close(() => process.exit(1));
  }
});
