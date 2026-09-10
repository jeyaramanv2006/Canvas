import assert from 'node:assert';
import app from '../server.js';
import { db } from '../database/db.js';

const PORT = 5064;
process.env.NODE_ENV = 'test';

const server = app.listen(PORT, async () => {
  try {
    console.log(`🧪 Running School Contact Details & Strength Sync Test Suite on port ${PORT}...`);
    const baseUrl = `http://localhost:${PORT}/api`;
    const rand = Math.floor(1000 + Math.random() * 9000);

    // 1. Authenticate CEO and Canvasser
    const ceoRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sudhan@ceo', password: 'password' })
    });
    const ceoAuth = await ceoRes.json();
    const ceoToken = ceoAuth.token;

    const cvsRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'gokul@cvs', password: 'password' })
    });
    const cvsAuth = await cvsRes.json();
    const cvsToken = cvsAuth.token;

    console.log('  ✓ 1. CEO & Field Canvasser Authenticated');

    // 2. CEO creates school with UNKNOWN contact person, phone, and strength (null/blank)
    const schoolName = `Greenwood International Academy ${rand}`;
    const createSchoolRes = await fetch(`${baseUrl}/master-schools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        school_name: schoolName,
        district: 'Salem',
        block_or_cluster: 'Hasthampatti',
        board: 'ICSE',
        student_strength: null, // Unknown initially
        contact_person: null,    // Unknown initially
        phone: null             // Unknown initially
      })
    });
    assert.strictEqual(createSchoolRes.status, 201);
    const createData = await createSchoolRes.json();
    const schoolId = createData.school.id;

    // Check in database directly
    const dbSchoolInitial = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(schoolId);
    assert.strictEqual(dbSchoolInitial.student_strength, null, 'Initial student_strength should be null');
    assert.strictEqual(dbSchoolInitial.contact_person, null, 'Initial contact_person should be null');
    assert.strictEqual(dbSchoolInitial.phone, null, 'Initial phone should be null');
    console.log(`  ✓ 2. Created master school ${schoolName} with unknown (null) contact details & strength`);

    // 3. Check CSV Export has '-' for this school's strength, contact_person, and phone
    const exportRes1 = await fetch(`${baseUrl}/master-schools/export`, {
      headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    assert.strictEqual(exportRes1.status, 200);
    const csv1 = await exportRes1.text();
    assert.ok(csv1.includes(`"${schoolName}"`), 'CSV should include school name');
    const schoolRow1 = csv1.split('\r\n').find(r => r.includes(schoolName));
    assert.ok(schoolRow1, 'CSV row found');
    assert.ok(schoolRow1.includes(',"-","-","-",'), 'CSV should contain dash "-" for unknown strength, contact, phone');
    console.log('  ✓ 3. CSV Export verified: Unknown strength, contact person, and phone output as "-"');

    // 4. Canvasser visits the school and captures contact details & strength in field
    const fieldContact = 'Dr. K. Sundararajan (Principal)';
    const fieldPhone = '9840198765';
    const fieldStrength = 1350;

    const logVisitRes = await fetch(`${baseUrl}/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cvsToken}`
      },
      body: JSON.stringify({
        is_from_master_db: true,
        master_school_id: schoolId,
        school_name: schoolName,
        district: 'Salem',
        cluster_or_block: 'Hasthampatti',
        institution_type: 'School',
        contact_person: fieldContact,
        phone: fieldPhone,
        student_strength: fieldStrength,
        product_interests: ['Socks', 'Ties'],
        product_specifications: 'Cotton rich socks, Navy blue with yellow stripe',
        interest_level: 'Hot',
        outcome_status: 'Sample Sent'
      })
    });
    assert.strictEqual(logVisitRes.status, 201);
    const visitData = await logVisitRes.json();
    const visitId = visitData.id;
    console.log(`  ✓ 4. Canvasser logged visit #${visitId} with contact: "${fieldContact}", phone: "${fieldPhone}", strength: ${fieldStrength}`);

    // 5. Verify master_schools in SQLite automatically updated with contact details & strength
    const dbSchoolUpdated1 = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(schoolId);
    assert.strictEqual(dbSchoolUpdated1.student_strength, fieldStrength, 'Master school student_strength should be 1350');
    assert.strictEqual(dbSchoolUpdated1.contact_person, fieldContact, 'Master school contact_person should be updated');
    assert.strictEqual(dbSchoolUpdated1.phone, fieldPhone, 'Master school phone should be updated');
    console.log('  ✓ 5. Master School SQLite DB automatically reflected contact details & strength');

    // 6. Canvasser updates visit during follow-up with revised contact details & strength
    const revisedContact = 'Sister Mary (Vice Principal)';
    const revisedPhone = '9840999888';
    const revisedStrength = 1500;

    const updateVisitRes = await fetch(`${baseUrl}/visits/${visitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cvsToken}`
      },
      body: JSON.stringify({
        contact_person: revisedContact,
        phone: revisedPhone,
        student_strength: revisedStrength,
        notes: 'Updated primary point of contact and enrollment'
      })
    });
    assert.strictEqual(updateVisitRes.status, 200);
    console.log('  ✓ 6. Canvasser updated visit with revised contact and strength');

    // 7. Verify master_schools updated to revised contact details & strength
    const dbSchoolUpdated2 = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(schoolId);
    assert.strictEqual(dbSchoolUpdated2.student_strength, revisedStrength, 'Master school student_strength should now be 1500');
    assert.strictEqual(dbSchoolUpdated2.contact_person, revisedContact, 'Master school contact_person should be revised');
    assert.strictEqual(dbSchoolUpdated2.phone, revisedPhone, 'Master school phone should be revised');
    console.log('  ✓ 7. Master School SQLite DB automatically updated with revised contact details & strength');

    // 8. Verify CSV export now outputs revised details
    const exportRes2 = await fetch(`${baseUrl}/master-schools/export`, {
      headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    const csv2 = await exportRes2.text();
    const schoolRow2 = csv2.split('\r\n').find(r => r.includes(schoolName));
    assert.ok(schoolRow2.includes(`,"${revisedStrength}","${revisedContact}","${revisedPhone}",`), 'CSV should contain updated details');
    console.log('  ✓ 8. CSV Export verified: Outputs revised contact details and strength');

    // 9. Canvasser logs unlisted/name-matched school without master_school_id -> Syncs contact and strength by name & district
    const schoolName2 = `St. Peter's Matriculation ${rand}`;
    db.prepare(`
      INSERT INTO master_schools (id, school_name, district, student_strength, contact_person, phone, status)
      VALUES (?, ?, ?, NULL, NULL, NULL, 'ACTIVE')
    `).run(`SCH-CHE-${rand}`, schoolName2, 'Chennai');

    const visitRes2 = await fetch(`${baseUrl}/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cvsToken}`
      },
      body: JSON.stringify({
        school_name: schoolName2,
        district: 'Chennai',
        institution_type: 'School',
        contact_person: 'Fr. Thomas (Correspondent)',
        phone: '9444123456',
        student_strength: 880
      })
    });
    assert.strictEqual(visitRes2.status, 201);

    const dbSchool2 = db.prepare('SELECT * FROM master_schools WHERE school_name = ?').get(schoolName2);
    assert.strictEqual(dbSchool2.student_strength, 880, 'Strength should update via name & district match');
    assert.strictEqual(dbSchool2.contact_person, 'Fr. Thomas (Correspondent)', 'Contact person should update');
    assert.strictEqual(dbSchool2.phone, '9444123456', 'Phone should update');
    console.log('  ✓ 9. Matched school contact details & strength updated via school_name & district match');

    console.log('\n🎉 ALL SCHOOL CONTACT DETAILS & STRENGTH SYNC TESTS PASSED!\n');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close(() => process.exit(1));
  }
});
