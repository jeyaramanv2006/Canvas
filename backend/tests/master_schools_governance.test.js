import assert from 'node:assert';
import app from '../server.js';
import { db } from '../database/db.js';

const PORT = 5062;
process.env.NODE_ENV = 'test';

const server = app.listen(PORT, async () => {
  try {
    console.log(`🧪 Running Master Schools Database & Governance Test Suite on port ${PORT}...`);
    const baseUrl = `http://localhost:${PORT}/api`;
    const rand = Math.floor(1000 + Math.random() * 9000);

    // 1. Authenticate CEO and Admin
    const ceoRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sudhan@ceo', password: 'password' })
    });
    const ceoAuth = await ceoRes.json();
    const ceoToken = ceoAuth.token;

    const adminRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@admin', password: 'password' })
    });
    const adminAuth = await adminRes.json();
    const adminToken = adminAuth.token;

    console.log('  ✓ 1. CEO & Admin Authenticated');

    // 2. CEO creates a master school directly -> Immediately in DB
    const ceoSchoolName = `CEO St. Mary's Academy ${rand}`;
    const ceoCreateRes = await fetch(`${baseUrl}/master-schools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        school_name: ceoSchoolName,
        district: 'Coimbatore',
        block_or_cluster: 'Gandhipuram',
        board: 'CBSE',
        student_strength: 1200,
        contact_person: 'Mr. David (Principal)',
        phone: '9840123456'
      })
    });
    assert.strictEqual(ceoCreateRes.status, 201);
    const ceoCreateData = await ceoCreateRes.json();
    assert.strictEqual(ceoCreateData.success, true);
    assert.strictEqual(ceoCreateData.requiresApproval, false);
    const ceoSchoolId = ceoCreateData.school.id;
    console.log(`  ✓ 2. CEO created school directly: ${ceoSchoolName} (${ceoSchoolId})`);

    // Verify in DB directly
    const dbSchool1 = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(ceoSchoolId);
    assert.ok(dbSchool1, 'School should exist in SQLite');
    assert.strictEqual(dbSchool1.school_name, ceoSchoolName);

    // 3. Admin creates school -> Queued in Pending Actions
    const adminSchoolName = `Admin Global Public School ${rand}`;
    const adminCreateRes = await fetch(`${baseUrl}/master-schools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        school_name: adminSchoolName,
        district: 'Madurai',
        block_or_cluster: 'Madurai North',
        board: 'Matriculation',
        student_strength: 950
      })
    });
    assert.strictEqual(adminCreateRes.status, 202);
    const adminCreateData = await adminCreateRes.json();
    assert.strictEqual(adminCreateData.requiresApproval, true);
    const createApprovalId = adminCreateData.approvalId;
    console.log(`  ✓ 3. Admin creation request queued as #${createApprovalId}`);

    // Verify NOT in master_schools yet
    const dbUnapproved = db.prepare('SELECT * FROM master_schools WHERE school_name = ?').get(adminSchoolName);
    assert.strictEqual(dbUnapproved, undefined, 'Unapproved school must not be in master_schools');

    // 4. CEO approves the creation request
    const approveCreateRes = await fetch(`${baseUrl}/approvals/${createApprovalId}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ decision: 'APPROVE' })
    });
    assert.strictEqual(approveCreateRes.status, 200);

    // Verify now in master_schools
    const dbApproved = db.prepare('SELECT * FROM master_schools WHERE school_name = ?').get(adminSchoolName);
    assert.ok(dbApproved, 'Approved school should now exist in SQLite master_schools');
    console.log(`  ✓ 4. CEO approved creation: ${adminSchoolName} now present in database`);

    // 5. CEO edits school directly
    const ceoEditRes = await fetch(`${baseUrl}/master-schools/${ceoSchoolId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        school_name: `${ceoSchoolName} (Updated)`,
        student_strength: 1500
      })
    });
    assert.strictEqual(ceoEditRes.status, 200);
    const dbEdited = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(ceoSchoolId);
    assert.strictEqual(dbEdited.student_strength, 1500);
    console.log(`  ✓ 5. CEO edited school directly`);

    // 6. Admin edits school -> Queued in Pending Actions
    const adminEditRes = await fetch(`${baseUrl}/master-schools/${dbApproved.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        school_name: `${adminSchoolName} (Admin Revised)`,
        student_strength: 1100
      })
    });
    assert.strictEqual(adminEditRes.status, 202);
    const editApprovalId = (await adminEditRes.json()).approvalId;
    console.log(`  ✓ 6. Admin edit request queued as #${editApprovalId}`);

    // CEO approves the edit
    const approveEditRes = await fetch(`${baseUrl}/approvals/${editApprovalId}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ decision: 'APPROVE' })
    });
    assert.strictEqual(approveEditRes.status, 200);
    const dbEditApproved = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(dbApproved.id);
    assert.strictEqual(dbEditApproved.student_strength, 1100);
    console.log(`  ✓ 7. CEO approved edit: Student strength updated to 1100 in SQLite`);

    // 7. Admin deletes school -> Queued in Pending Actions
    const adminDeleteRes = await fetch(`${baseUrl}/master-schools/${dbApproved.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(adminDeleteRes.status, 202);
    const deleteApprovalId = (await adminDeleteRes.json()).approvalId;
    console.log(`  ✓ 8. Admin deletion request queued as #${deleteApprovalId}`);

    // CEO approves deletion
    const approveDeleteRes = await fetch(`${baseUrl}/approvals/${deleteApprovalId}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ decision: 'APPROVE' })
    });
    assert.strictEqual(approveDeleteRes.status, 200);
    const dbDeleted = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(dbApproved.id);
    assert.strictEqual(dbDeleted, undefined, 'Deleted school should be removed from database');
    console.log(`  ✓ 9. CEO approved deletion: School removed from database`);

    // 8. Test CSV Export Endpoint
    const exportRes = await fetch(`${baseUrl}/master-schools/export`, {
      headers: {
        'Authorization': `Bearer ${ceoToken}`
      }
    });
    assert.strictEqual(exportRes.status, 200);
    assert.ok(exportRes.headers.get('content-type').includes('text/csv'));
    const csvContent = await exportRes.text();
    assert.ok(csvContent.includes('"ID","School Name","District"'));
    assert.ok(csvContent.includes(ceoSchoolId));
    console.log(`  ✓ 10. CSV Export verified: Valid CSV stream received with correct headers & data`);

    console.log('\n🎉 ALL MASTER SCHOOLS DATABASE & GOVERNANCE TESTS PASSED!');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
});
