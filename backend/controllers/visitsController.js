import { db } from '../database/db.js';
import { calculateVisitDiff } from '../utils/diff.js';

function safeJsonParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val !== 'string') return Array.isArray(val) || typeof val === 'object' ? val : fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatVisitRow(row, auditLogs = []) {
  if (!row) return null;
  return {
    ...row,
    is_from_master_db: Boolean(row.is_from_master_db),
    product_interests: safeJsonParse(row.product_interests, ['Socks']),
    attachments: safeJsonParse(row.attachments, []),
    discovery_status: row.discovery_status || (row.is_from_master_db ? 'NOT_APPLICABLE' : 'PENDING_VERIFICATION'),
    discovery_bonus_awarded: Boolean(row.discovery_bonus_awarded),
    discovery_bonus_amount: Number(row.discovery_bonus_amount) || 0,
    verified_by_id: row.verified_by_id || null,
    verified_by_name: row.verified_by_name || null,
    verified_at: row.verified_at || null,
    verification_notes: row.verification_notes || '',
    edit_history: (auditLogs || []).map(log => ({
      id: `EDT-${log.id}`,
      editor_name: log.actor_name,
      editor_role: log.actor_role,
      action: log.action,
      timestamp: log.timestamp,
      changes: safeJsonParse(log.changed_fields, [])
    }))
  };
}

export async function getVisits(req, res) {
  try {
    const user = req.user;
    const { search, district, canvasser_id, interest_level, outcome_status } = req.query;

    let query = 'SELECT * FROM visits WHERE 1=1';
    const params = [];

    // RBAC: Canvassers only see their own visits
    if (['canvasser', 'cvs'].includes(user.role)) {
      query += ' AND canvasser_id = ?';
      params.push(user.id);
    } else if (canvasser_id) {
      query += ' AND canvasser_id = ?';
      params.push(Number(canvasser_id));
    }

    if (district && district !== 'all') {
      query += ' AND district = ?';
      params.push(district);
    }

    if (interest_level && interest_level !== 'all') {
      query += ' AND interest_level = ?';
      params.push(interest_level);
    }

    if (outcome_status && outcome_status !== 'all') {
      query += ' AND outcome_status = ?';
      params.push(outcome_status);
    }

    if (search && search.trim()) {
      const s = `%${search.trim().toLowerCase()}%`;
      query += ' AND (LOWER(school_name) LIKE ? OR LOWER(district) LIKE ? OR LOWER(contact_person) LIKE ? OR phone LIKE ?)';
      params.push(s, s, s, s);
    }

    query += ' ORDER BY created_at DESC';

    const rows = await db.prepare(query).all(...params);

    // Fetch audit logs for all visits
    const allAuditLogs = await db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all();
    const auditMap = {};
    for (const log of (allAuditLogs || [])) {
      if (!auditMap[log.visit_id]) auditMap[log.visit_id] = [];
      auditMap[log.visit_id].push(log);
    }

    const visits = (rows || []).map(r => formatVisitRow(r, auditMap[r.id] || []));
    return res.json(visits);
  } catch (error) {
    console.error('getVisits error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getVisitById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // RBAC check for canvassers
    if (['canvasser', 'cvs'].includes(req.user.role) && row.canvasser_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this visit record' });
    }

    const auditLogs = await db.prepare('SELECT * FROM audit_logs WHERE visit_id = ? ORDER BY timestamp DESC').all(id);
    return res.json(formatVisitRow(row, auditLogs || []));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createVisit(req, res) {
  try {
    const user = req.user;
    const body = req.body || {};

    const missing = [];
    if (!body.school_name || !String(body.school_name).trim()) missing.push('School Name');
    if (!body.district || !String(body.district).trim()) missing.push('District');
    if (!body.institution_type || !String(body.institution_type).trim()) missing.push('Board / Institution Type');
    if (!body.contact_person || !String(body.contact_person).trim()) missing.push('Contact Person');
    if (!body.phone || !String(body.phone).trim()) missing.push('Phone Number');

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Please fill in required fields: ${missing.join(', ')}`
      });
    }

    const now = new Date().toISOString();
    const productInterests = JSON.stringify(Array.isArray(body.product_interests) ? body.product_interests : ['Socks']);
    const attachments = JSON.stringify(Array.isArray(body.attachments) ? body.attachments : []);

    const isFromMaster = body.is_from_master_db ? 1 : 0;
    const discoveryStatus = isFromMaster ? 'NOT_APPLICABLE' : 'PENDING_VERIFICATION';

    // Extract numbers safely from student_strength (e.g. "500 students" -> 500)
    let parsedStrength = null;
    if (body.student_strength !== undefined && body.student_strength !== null && body.student_strength !== '') {
      const digits = String(body.student_strength).replace(/[^\d]/g, '');
      if (digits) {
        parsedStrength = parseInt(digits, 10);
      }
    }

    const stmt = db.prepare(`
      INSERT INTO visits (
        canvasser_id, canvasser_name, is_from_master_db, master_school_id,
        school_name, district, cluster_or_block, institution_type, contact_person,
        phone, student_strength, product_interests, product_specifications,
        attachments, interest_level, outcome_status, follow_up_date, notes,
        discovery_status, discovery_bonus_awarded, discovery_bonus_amount,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?
      )
    `);

    const result = await stmt.run(
      user.id,
      user.name || 'Field Canvasser',
      isFromMaster,
      body.master_school_id || null,
      String(body.school_name).trim(),
      String(body.district).trim(),
      body.cluster_or_block ? String(body.cluster_or_block).trim() : '',
      String(body.institution_type).trim(),
      String(body.contact_person).trim(),
      String(body.phone).trim(),
      parsedStrength,
      productInterests,
      body.product_specifications ? String(body.product_specifications).trim() : '',
      attachments,
      body.interest_level || 'Warm',
      body.outcome_status || 'Open',
      body.follow_up_date || null,
      body.notes ? String(body.notes).trim() : '',
      discoveryStatus,
      0,
      0,
      now,
      now
    );

    const latestRow = await db.prepare('SELECT id FROM visits ORDER BY id DESC LIMIT 1').get();
    const newId = result.lastInsertRowid || (latestRow ? latestRow.id : 1);

    // Auto-create CREATE audit log entry
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const createDiff = [
      { field: 'Initial Record', from: 'None', to: `Logged initial visit for ${body.school_name}` }
    ];

    await insertAudit.run(
      newId,
      user.id,
      user.name || 'Staff',
      ['canvasser', 'cvs'].includes(user.role) ? 'Canvasser' : 'Admin',
      'CREATE',
      JSON.stringify(createDiff),
      now
    );

    const createdRow = await db.prepare('SELECT * FROM visits WHERE id = ?').get(newId);
    const auditLogs = await db.prepare('SELECT * FROM audit_logs WHERE visit_id = ? ORDER BY timestamp DESC').all(newId);

    // Auto-update master_schools table with field details (student_strength, contact_person, phone)
    try {
      const updates = [];
      const updateParams = [];

      if (body.student_strength && Number(body.student_strength) > 0) {
        updates.push('student_strength = ?');
        updateParams.push(Number(body.student_strength));
      }
      if (body.contact_person && body.contact_person.trim()) {
        updates.push('contact_person = ?');
        updateParams.push(body.contact_person.trim());
      }
      if (body.phone && body.phone.trim()) {
        updates.push('phone = ?');
        updateParams.push(body.phone.trim());
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        if (body.master_school_id) {
          await db.prepare(`UPDATE master_schools SET ${updates.join(', ')} WHERE id = ?`).run(...updateParams, body.master_school_id);
        } else if (body.school_name && body.district) {
          await db.prepare(`UPDATE master_schools SET ${updates.join(', ')} WHERE LOWER(school_name) = LOWER(?) AND LOWER(district) = LOWER(?)`).run(...updateParams, body.school_name.trim(), body.district.trim());
        }
      }
    } catch (err) {
      console.warn('Could not auto-sync visit details to master_schools:', err.message);
    }

    return res.status(201).json(formatVisitRow(createdRow, auditLogs || []));
  } catch (error) {
    console.error('createVisit error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function updateVisit(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const user = req.user;
    const updateData = req.body;

    const current = await db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // RBAC: Canvassers can only edit their own visits
    if (['canvasser', 'cvs'].includes(user.role) && current.canvasser_id !== user.id) {
      return res.status(403).json({ error: 'Access denied: cannot edit other canvassers visits' });
    }

    // Calculate structured field differences for Audit Trail
    const diff = calculateVisitDiff(current, updateData);

    const now = new Date().toISOString();
    const editorName = user.name || 'Staff';
    const editorRole = (['canvasser', 'cvs'].includes(user.role)) ? 'Canvasser' : 'Admin';

    // Prepare update parameters
    const schoolName = updateData.school_name !== undefined ? updateData.school_name : current.school_name;
    const district = updateData.district !== undefined ? updateData.district : current.district;
    const clusterOrBlock = updateData.cluster_or_block !== undefined ? updateData.cluster_or_block : current.cluster_or_block;
    const institutionType = updateData.institution_type !== undefined ? updateData.institution_type : current.institution_type;
    const contactPerson = updateData.contact_person !== undefined ? updateData.contact_person : current.contact_person;
    const phone = updateData.phone !== undefined ? updateData.phone : current.phone;
    const studentStrength = updateData.student_strength !== undefined
      ? (updateData.student_strength ? Number(updateData.student_strength) : null)
      : current.student_strength;
    const productInterests = updateData.product_interests !== undefined
      ? JSON.stringify(Array.isArray(updateData.product_interests) ? updateData.product_interests : [])
      : current.product_interests;
    const productSpecifications = updateData.product_specifications !== undefined
      ? updateData.product_specifications
      : current.product_specifications;
    const attachments = updateData.attachments !== undefined
      ? JSON.stringify(Array.isArray(updateData.attachments) ? updateData.attachments : [])
      : current.attachments;
    const interestLevel = updateData.interest_level !== undefined ? updateData.interest_level : current.interest_level;
    const outcomeStatus = updateData.outcome_status !== undefined ? updateData.outcome_status : current.outcome_status;
    const followUpDate = updateData.follow_up_date !== undefined ? updateData.follow_up_date : current.follow_up_date;
    const notes = updateData.notes !== undefined ? updateData.notes : current.notes;

    await db.prepare(`
      UPDATE visits SET
        school_name = ?,
        district = ?,
        cluster_or_block = ?,
        institution_type = ?,
        contact_person = ?,
        phone = ?,
        student_strength = ?,
        product_interests = ?,
        product_specifications = ?,
        attachments = ?,
        interest_level = ?,
        outcome_status = ?,
        follow_up_date = ?,
        notes = ?,
        last_edited_by_name = ?,
        last_edited_by_role = ?,
        last_edited_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      schoolName,
      district,
      clusterOrBlock,
      institutionType,
      contactPerson,
      phone,
      studentStrength,
      productInterests,
      productSpecifications,
      attachments,
      interestLevel,
      outcomeStatus,
      followUpDate,
      notes,
      editorName,
      editorRole,
      now,
      now,
      id
    );

    // Insert UPDATE audit log entry
    await db.prepare(`
      INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.id,
      editorName,
      editorRole,
      'UPDATE',
      JSON.stringify(diff),
      now
    );

    const updatedRow = await db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
    const auditLogs = await db.prepare('SELECT * FROM audit_logs WHERE visit_id = ? ORDER BY timestamp DESC').all(id);

    // Auto-update master_schools table with updated visit details (student_strength, contact_person, phone)
    try {
      const updates = [];
      const updateParams = [];

      if (studentStrength && Number(studentStrength) > 0) {
        updates.push('student_strength = ?');
        updateParams.push(Number(studentStrength));
      }
      if (contactPerson && contactPerson.trim()) {
        updates.push('contact_person = ?');
        updateParams.push(contactPerson.trim());
      }
      if (phone && phone.trim()) {
        updates.push('phone = ?');
        updateParams.push(phone.trim());
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        if (current.master_school_id) {
          await db.prepare(`UPDATE master_schools SET ${updates.join(', ')} WHERE id = ?`).run(...updateParams, current.master_school_id);
        } else if (schoolName && district) {
          await db.prepare(`UPDATE master_schools SET ${updates.join(', ')} WHERE LOWER(school_name) = LOWER(?) AND LOWER(district) = LOWER(?)`).run(...updateParams, schoolName.trim(), district.trim());
        }
      }
    } catch (err) {
      console.warn('Could not auto-sync visit details on updateVisit:', err.message);
    }

    return res.json(formatVisitRow(updatedRow, auditLogs || []));
  } catch (error) {
    console.error('updateVisit error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteVisit(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const user = req.user;

    const current = await db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (['canvasser', 'cvs'].includes(user.role) && current.canvasser_id !== user.id) {
      return res.status(403).json({ error: 'Access denied: cannot delete other canvasser visits' });
    }

    // Insert DELETE audit log before removing
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.id,
      user.name || 'Staff',
      ['canvasser', 'cvs'].includes(user.role) ? 'Canvasser' : 'Admin',
      'DELETE',
      JSON.stringify([{ field: 'Record Status', from: current.school_name, to: 'Deleted' }]),
      now
    );

    await db.prepare('DELETE FROM visits WHERE id = ?').run(id);

    return res.json({ success: true, message: 'Visit deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function verifySchoolDiscovery(req, res) {
  try {
    const visitId = parseInt(req.params.id, 10);
    const actor = req.user;
    const { action, master_school_id, school_data, bonus_amount = 1000, notes = '' } = req.body;

    const current = await db.prepare('SELECT * FROM visits WHERE id = ?').get(visitId);
    if (!current) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    const now = new Date().toISOString();

    if (action === 'LINK_EXISTING') {
      // 1. Link to Existing Master School (Typo Resolution)
      if (!master_school_id) {
        return res.status(400).json({ error: 'master_school_id is required to link to an existing school' });
      }

      const masterSchool = await db.prepare('SELECT * FROM master_schools WHERE id = ?').get(master_school_id);
      if (!masterSchool) {
        return res.status(404).json({ error: 'Selected master school not found in database' });
      }

      // Update visit with correct master school canonical data
      await db.prepare(`
        UPDATE visits SET
          is_from_master_db = 1,
          master_school_id = ?,
          school_name = ?,
          district = ?,
          discovery_status = 'LINKED_EXISTING',
          discovery_bonus_awarded = 0,
          discovery_bonus_amount = 0,
          verified_by_id = ?,
          verified_by_name = ?,
          verified_at = ?,
          verification_notes = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        masterSchool.id,
        masterSchool.school_name,
        masterSchool.district,
        actor.id,
        actor.name || 'Admin',
        now,
        notes || `Resolved typo: Linked to existing master school ${masterSchool.school_name} (${masterSchool.id})`,
        now,
        visitId
      );

      // Log Audit Entry
      await db.prepare(`
        INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, 'VERIFY_DISCOVERY', ?, ?)
      `).run(
        visitId,
        actor.id,
        actor.name || 'Admin',
        actor.role || 'admin',
        JSON.stringify([
          { field: 'Discovery Verification', from: `Newly Discovered (${current.school_name})`, to: `Linked to Master DB (${masterSchool.school_name})` },
          { field: 'Typo / Canonical Name Correction', from: current.school_name, to: masterSchool.school_name },
          { field: 'Verification Notes', from: '', to: notes || 'Linked to existing master school' }
        ]),
        now
      );

      const updated = await db.prepare('SELECT * FROM visits WHERE id = ?').get(visitId);
      const auditLogs = await db.prepare('SELECT * FROM audit_logs WHERE visit_id = ? ORDER BY timestamp DESC').all(visitId);
      return res.json({
        success: true,
        message: `Visit successfully linked to existing Master School "${masterSchool.school_name}".`,
        visit: formatVisitRow(updated, auditLogs || [])
      });

    } else if (action === 'APPROVE_NEW_SCHOOL') {
      // 2. Verify as Genuine New School & Add to Master DB (+ Discovery Bonus)
      const schoolName = (school_data?.school_name || current.school_name).trim();
      const district = (school_data?.district || current.district).trim();
      const blockOrCluster = (school_data?.block_or_cluster || current.cluster_or_block || 'General Block').trim();
      const zone = (school_data?.zone || 'Tamil Nadu').trim();
      const board = (school_data?.board || 'Matriculation').trim();
      const area = (school_data?.area || district).trim();
      const studentStrength = school_data?.student_strength ? Number(school_data.student_strength) : (current.student_strength || null);
      const contactPerson = (school_data?.contact_person || current.contact_person || '').trim();
      const phone = (school_data?.phone || current.phone || '').trim();
      const priority = school_data?.priority || 'High';

      const distCode = district.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'SCH';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newMasterId = `SCH-${distCode}-${randomSuffix}`;

      // Insert new school into master_schools catalog
      await db.prepare(`
        INSERT INTO master_schools 
        (id, school_name, district, block_or_cluster, zone, board, area, student_strength, contact_person, phone, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(
        newMasterId,
        schoolName,
        district,
        blockOrCluster,
        zone,
        board,
        area,
        studentStrength,
        contactPerson,
        phone,
        priority
      );

      const awardedBonus = Number(bonus_amount) || 1000;

      // Update visit with newly created master school ID & bonus award
      await db.prepare(`
        UPDATE visits SET
          is_from_master_db = 1,
          master_school_id = ?,
          school_name = ?,
          district = ?,
          discovery_status = 'VERIFIED_NEW',
          discovery_bonus_awarded = 1,
          discovery_bonus_amount = ?,
          verified_by_id = ?,
          verified_by_name = ?,
          verified_at = ?,
          verification_notes = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        newMasterId,
        schoolName,
        district,
        awardedBonus,
        actor.id,
        actor.name || 'Admin',
        now,
        notes || `Verified as genuine new school. Added to Master DB (${newMasterId}) and awarded ₹${awardedBonus.toLocaleString('en-IN')} discovery bonus.`,
        now,
        visitId
      );

      // Log Audit Entry
      await db.prepare(`
        INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, 'VERIFY_DISCOVERY', ?, ?)
      `).run(
        visitId,
        actor.id,
        actor.name || 'Admin',
        actor.role || 'admin',
        JSON.stringify([
          { field: 'Discovery Verification', from: 'Newly Discovered (Pending)', to: `Approved & Added to Master DB (${newMasterId})` },
          { field: 'Discovery Bonus', from: '₹0', to: `₹${awardedBonus.toLocaleString('en-IN')} Credited to ${current.canvasser_name}` },
          { field: 'Master School Added', from: 'None', to: `${schoolName} [${newMasterId}]` }
        ]),
        now
      );

      const updated = await db.prepare('SELECT * FROM visits WHERE id = ?').get(visitId);
      const auditLogs = await db.prepare('SELECT * FROM audit_logs WHERE visit_id = ? ORDER BY timestamp DESC').all(visitId);
      return res.json({
        success: true,
        message: `School verified and added to Master Catalog (${newMasterId}). ₹${awardedBonus.toLocaleString('en-IN')} discovery bonus awarded to ${current.canvasser_name}!`,
        newMasterId,
        visit: formatVisitRow(updated, auditLogs || [])
      });

    } else {
      return res.status(400).json({ error: 'Invalid action. Expected LINK_EXISTING or APPROVE_NEW_SCHOOL' });
    }
  } catch (error) {
    console.error('verifySchoolDiscovery error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getSchoolHistory(req, res) {
  try {
    const schoolName = req.params.name;
    const district = req.query.district;

    let query = 'SELECT * FROM visits WHERE LOWER(school_name) = LOWER(?)';
    const params = [schoolName];

    if (district) {
      query += ' AND LOWER(district) = LOWER(?)';
      params.push(district);
    }

    query += ' ORDER BY created_at DESC';

    const rows = await db.prepare(query).all(...params);
    return res.json((rows || []).map(r => formatVisitRow(r)));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
