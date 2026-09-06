import assert from 'node:assert';
import app from '../server.js';

const PORT = 5056;
process.env.NODE_ENV = 'test';

const server = app.listen(PORT, async () => {
  try {
    console.log(`🧪 Running Role-Based User Management & Approval Workflow test suite on port ${PORT}...`);
    const baseUrl = `http://localhost:${PORT}/api`;
    const rand = Math.floor(1000 + Math.random() * 9000);

    // 1. Authenticate CEO via <name>@<role> format
    const ceoLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sudhan@ceo', password: 'password' })
    });
    assert.strictEqual(ceoLoginRes.status, 200);
    const ceoAuth = await ceoLoginRes.json();
    assert.strictEqual(ceoAuth.user.username, 'sudhan@ceo');
    assert.strictEqual(ceoAuth.user.role, 'ceo');
    const ceoToken = ceoAuth.token;
    console.log('  ✓ 1. CEO Login with "sudhan@ceo" passed');

    // 2. Authenticate Admin via <name>@<role> format
    const adminLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@admin', password: 'password' })
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminAuth = await adminLoginRes.json();
    assert.strictEqual(adminAuth.user.username, 'admin@admin');
    const adminToken = adminAuth.token;
    console.log('  ✓ 2. Admin Login with "admin@admin" passed');

    // 3. Authenticate Canvasser via <name>@<role> format
    const cvsLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'gokul@cvs', password: 'password' })
    });
    assert.strictEqual(cvsLoginRes.status, 200);
    const cvsAuth = await cvsLoginRes.json();
    assert.strictEqual(cvsAuth.user.username, 'gokul@cvs');
    console.log('  ✓ 3. Canvasser Login with "gokul@cvs" passed');

    // 4. CEO creates a user directly -> Immediately present in database
    const ceoCreatedName = `Selvan${rand}`;
    const expectedCeoUsername = `${ceoCreatedName.toLowerCase()}@cvs`;

    const ceoCreateRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        name: ceoCreatedName,
        role: 'cvs',
        role_title: 'Junior Field Executive',
        initial_password: 'password'
      })
    });
    assert.strictEqual(ceoCreateRes.status, 201);
    const ceoCreateData = await ceoCreateRes.json();
    assert.strictEqual(ceoCreateData.status, 'SUCCESS');
    assert.strictEqual(ceoCreateData.user.username, expectedCeoUsername);
    console.log(`  ✓ 4. CEO Direct User Creation (${expectedCeoUsername} created immediately) passed`);

    // 5. Admin requests user creation -> Queued into PendingUserActions (Status: PENDING)
    const adminCreatedName = `Kannan${rand}`;
    const expectedAdminUsername = `${adminCreatedName.toLowerCase()}@cvs`;

    const adminCreateRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: adminCreatedName,
        role: 'cvs',
        role_title: 'Field Canvasser',
        initial_password: 'password'
      })
    });
    assert.strictEqual(adminCreateRes.status, 202);
    const adminCreateData = await adminCreateRes.json();
    assert.strictEqual(adminCreateData.status, 'PENDING');
    const rejectActionId = adminCreateData.action_id;
    console.log(`  ✓ 5. Admin Queued User Creation (Action #${rejectActionId} for ${expectedAdminUsername} queued as PENDING) passed`);

    // Verify user is NOT yet in users table
    const usersListRes1 = await fetch(`${baseUrl}/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const usersList1 = await usersListRes1.json();
    assert.ok(!usersList1.some(u => u.username === expectedAdminUsername));
    console.log(`  ✓ 6. Verified unapproved user "${expectedAdminUsername}" is NOT in users table`);

    // 6. CEO views pending approvals & Rejects the action
    const approvalsRes1 = await fetch(`${baseUrl}/approvals`, {
      headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    assert.strictEqual(approvalsRes1.status, 200);
    const pendingList1 = await approvalsRes1.json();
    assert.ok(pendingList1.some(a => a.id === rejectActionId));

    const rejectRes = await fetch(`${baseUrl}/approvals/${rejectActionId}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ decision: 'REJECT', notes: 'Hiring freeze for territory' })
    });
    assert.strictEqual(rejectRes.status, 200);
    const rejectData = await rejectRes.json();
    assert.strictEqual(rejectData.status, 'REJECTED');
    console.log('  ✓ 7. CEO Rejection Flow (Action marked REJECTED and discarded) passed');

    // 7. Admin creates another user (Anand) -> CEO Approves
    const approveName = `Anand${rand}`;
    const expectedApproveUsername = `${approveName.toLowerCase()}@cvs`;

    const adminCreateRes2 = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: approveName,
        role: 'cvs',
        role_title: 'Territory Canvasser',
        initial_password: 'password'
      })
    });
    assert.strictEqual(adminCreateRes2.status, 202);
    const approveActionId = (await adminCreateRes2.json()).action_id;

    const approveRes = await fetch(`${baseUrl}/approvals/${approveActionId}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ decision: 'APPROVE', notes: 'Approved for Q3 expansion' })
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.status, 'APPROVED');

    // Verify user IS NOW in users table
    const usersListRes2 = await fetch(`${baseUrl}/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const usersList2 = await usersListRes2.json();
    const anandUser = usersList2.find(u => u.username === expectedApproveUsername);
    assert.ok(anandUser);
    assert.strictEqual(anandUser.role, 'cvs');
    console.log(`  ✓ 8. CEO Approval Flow (${expectedApproveUsername} approved & provisioned in users table) passed`);

    // 8. Security Check: Admin cannot delete or modify CEO account
    const adminDeleteCeoRes = await fetch(`${baseUrl}/users/10`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminDeleteCeoRes.status, 403);
    console.log('  ✓ 9. Security Enforcement (Admin blocked from modifying CEO account) passed');

    console.log('\n🎉 ALL ROLE-BASED APPROVAL WORKFLOW TESTS PASSED SUCCESSFULLY!\n');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    server.close(() => process.exit(1));
  }
});
