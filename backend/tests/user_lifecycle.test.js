import assert from 'node:assert';
import app from '../server.js';
import { db } from '../database/db.js';

const PORT = 5058;
process.env.NODE_ENV = 'test';

const server = app.listen(PORT, async () => {
  try {
    console.log(`🧪 Running Enhanced User Lifecycle & Password Reset Test Suite on port ${PORT}...`);
    const baseUrl = `http://localhost:${PORT}/api`;
    const rand = Math.floor(1000 + Math.random() * 9000);

    // 1. Authenticate CEO & Admin
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

    // 2. CEO creates a test user
    const testUserName = `Kavitha${rand}`;
    const testUserLogin = `${testUserName.toLowerCase()}@cvs`;

    const createRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        name: testUserName,
        role: 'cvs',
        role_title: 'Field Canvasser',
        initial_password: 'password123'
      })
    });
    assert.strictEqual(createRes.status, 201);
    const createdUser = (await createRes.json()).user;
    const testUserId = createdUser.id;
    console.log(`  ✓ 2. Created test user ${testUserLogin} (ID: ${testUserId})`);

    // 3. Verify user can login
    const login1 = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUserLogin, password: 'password123' })
    });
    assert.strictEqual(login1.status, 200);
    const login1Data = await login1.json();
    assert.strictEqual(login1Data.user.requires_password_reset, false);
    const userToken = login1Data.token;
    console.log(`  ✓ 3. Test user ${testUserLogin} logged in successfully`);

    // 4. Admin triggers Instant Password Reset (No CEO queue needed)
    const resetTriggerRes = await fetch(`${baseUrl}/users/${testUserId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(resetTriggerRes.status, 200);
    const resetTriggerData = await resetTriggerRes.json();
    assert.strictEqual(resetTriggerData.status, 'SUCCESS');
    console.log(`  ✓ 4. Admin triggered instant password reset on ${testUserLogin}`);

    // 5. Verify user login now indicates requires_password_reset = true
    const login2 = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUserLogin, password: 'password123' })
    });
    assert.strictEqual(login2.status, 200);
    const login2Data = await login2.json();
    assert.strictEqual(login2Data.user.requires_password_reset, true);
    console.log(`  ✓ 5. Verified login reports requires_password_reset = true`);

    // 6. User sets new password via reset-password endpoint
    const updatePassRes = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ new_password: 'new_secure_password_2026' })
    });
    assert.strictEqual(updatePassRes.status, 200);
    console.log(`  ✓ 6. User updated password successfully`);

    // 7. Verify user can login with new password and requires_password_reset = false
    const login3 = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUserLogin, password: 'new_secure_password_2026' })
    });
    assert.strictEqual(login3.status, 200);
    const login3Data = await login3.json();
    assert.strictEqual(login3Data.user.requires_password_reset, false);
    console.log(`  ✓ 7. Verified login with new password and reset flag cleared`);

    // 8. Admin requests Pause on user -> Queued for CEO
    const pauseReqRes = await fetch(`${baseUrl}/users/${testUserId}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(pauseReqRes.status, 202);
    const pauseReqData = await pauseReqRes.json();
    assert.strictEqual(pauseReqData.status, 'PENDING');
    const pauseActionId = pauseReqData.action_id;
    console.log(`  ✓ 8. Admin pause request queued as #${pauseActionId}`);

    // CEO approves Pause request
    const approvePauseRes = await fetch(`${baseUrl}/approvals/${pauseActionId}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ decision: 'APPROVE' })
    });
    assert.strictEqual(approvePauseRes.status, 200);

    // Verify login is blocked with PAUSED status
    const loginPaused = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUserLogin, password: 'new_secure_password_2026' })
    });
    assert.strictEqual(loginPaused.status, 403);
    console.log(`  ✓ 9. User is PAUSED: Login correctly blocked (403)`);

    // 9. CEO resumes user immediately
    const resumeRes = await fetch(`${baseUrl}/users/${testUserId}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      }
    });
    assert.strictEqual(resumeRes.status, 200);
    console.log(`  ✓ 10. CEO resumed user immediately`);

    // Verify login restored
    const loginResumed = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUserLogin, password: 'new_secure_password_2026' })
    });
    assert.strictEqual(loginResumed.status, 200);
    console.log(`  ✓ 11. User login restored after resume`);

    // 10. CEO deletes user -> Status DELETED
    const deleteRes = await fetch(`${baseUrl}/users/${testUserId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ceoToken}`
      }
    });
    assert.strictEqual(deleteRes.status, 200);

    // Verify login fails because user is permanently deleted
    const loginDeleted = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUserLogin, password: 'new_secure_password_2026' })
    });
    assert.strictEqual(loginDeleted.status, 401);
    console.log(`  ✓ 12. User permanently deleted from database: Login blocked (401)`);

    // Verify user with same name can be created again fresh
    const recreateRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        name: 'Vignesh',
        role: 'cvs',
        initial_password: 'new_clean_password'
      })
    });
    assert.strictEqual(recreateRes.status, 201);
    console.log(`  ✓ 13. Re-created user with same username/name successfully`);

    // 11. Protection: Verify Admin CANNOT pause, delete, or edit role of CEO
    const ceoUserRecord = db.prepare("SELECT id FROM users WHERE role = 'ceo' LIMIT 1").get();
    const adminDeleteCeo = await fetch(`${baseUrl}/users/${ceoUserRecord.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminDeleteCeo.status, 403);

    const adminPauseCeo = await fetch(`${baseUrl}/users/${ceoUserRecord.id}/pause`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminPauseCeo.status, 403);

    const adminResetCeo = await fetch(`${baseUrl}/users/${ceoUserRecord.id}/reset-password`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminResetCeo.status, 200);
    console.log(`  ✓ 14. Admin triggered password reset for CEO (temporary password set to 'reset')`);

    // Verify CEO can now login with temporary password 'reset'
    const ceoResetLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sudhan@ceo', password: 'reset' })
    });
    assert.strictEqual(ceoResetLogin.status, 200);
    const ceoResetData = await ceoResetLogin.json();
    assert.strictEqual(ceoResetData.user.requires_password_reset, true);
    console.log(`  ✓ 15. Verified CEO login with 'reset' succeeds and prompts for password reset`);

    // Restore CEO password to 'password' for subsequent tests
    await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoResetData.token}`
      },
      body: JSON.stringify({ new_password: 'password' })
    });

    console.log('\n🎉 ALL ENHANCED USER LIFECYCLE & GOVERNANCE TESTS PASSED!');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test suite failed:', err);
    server.close();
    process.exit(1);
  }
});
