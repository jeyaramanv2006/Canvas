import { db } from '../database/db.js';
import { calculateVisitDiff } from '../utils/diff.js';

function formatVisitRow(row, auditLogs = []) {
  if (!row) return null;
  return {
    ...row,
    is_from_master_db: Boolean(row.is_from_master_db),
    product_interests: typeof row.product_interests === 'string'
      ? JSON.parse(row.product_interests || '[]')
      : (row.product_interests || []),
    attachments: typeof row.attachments === 'string'
      ? JSON.parse(row.attachments || '[]')
      : (row.attachments || []),
    edit_history: auditLogs.map(log => ({
      id: `EDT-${log.id}`,
      editor_name: log.actor_name,
      editor_role: log.actor_role,
      action: log.action,
      timestamp: log.timestamp,
      changes: typeof log.changed_fields === 'string'
        ? JSON.parse(log.changed_fields || '[]')
        : (log.changed_fields || [])
    }))
  };
}

export function getVisits(req, res) {
  try {
    const user = req.user;
    const { search, district, canvasser_id, interest_level, outcome_status } = req.query;

    let query = 'SELECT * FROM visits WHERE 1=1';
    const params = [];

    // RBAC: Canvassers only see their own visits
    if (user.role === 'canvasser') {
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

    const rows = db.prepare(query).all(...params);

    // Fetch audit logs for all visits
    const allAuditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all();
    const auditMap = {};
    for (const log of allAuditLogs) {
      if (!auditMap[log.visit_id]) auditMap[log.visit_id] = [];
      auditMap[log.visit_id].push(log);
    }

    const visits = rows.map(r => formatVisitRow(r, auditMap[r.id] || []));
    return res.json(visits);
  } catch (error) {
    console.error('getVisits error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export function getVisitById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const row = db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // RBAC check for canvassers
    if (req.user.role === 'canvasser' && row.canvasser_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this visit record' });
    }

    const auditLogs = db.prepare('SELECT * FROM audit_logs WHERE visit_id = ? ORDER BY timestamp DESC').all(id);
    return res.json(formatVisitRow(row, auditLogs));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export function createVisit(req, res) {
  try {
    const user = req.user;
    const body = req.body;

    if (!body.school_name || !body.district || !body.institution_type || !body.contact_person || !body.phone) {
      return res.status(400).json({ error: 'Required fields: school_name, district, institution_type, contact_person, phone' });
    }

    const now = new Date().toISOString();
    const productInterests = JSON.stringify(Array.isArray(body.product_interests) ? body.product_interests : ['Socks']);
    const attachments = JSON.stringify(Array.isArray(body.attachments) ? body.attachments : []);

    const stmt = db.prepare(`
      INSERT INTO visits (
        canvasser_id, canvasser_name, is_from_master_db, master_school_id,
        school_name, district, cluster_or_block, institution_type, contact_person,
        phone, student_strength, product_interests, product_specifications,
        attachments, interest_level, outcome_status, follow_up_date, notes,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    const result = stmt.run(
      user.id,
      user.name || 'Field Canvasser',
      body.is_from_master_db ? 1 : 0,
      body.master_school_id || null,
      body.school_name,
      body.district,
      body.cluster_or_block || '',
      body.institution_type,
      body.contact_person,
      body.phone,
      body.student_strength ? Number(body.student_strength) : null,
      productInterests,
      body.product_specifications || '',
      attachments,
      body.interest_level || 'Warm',
      body.outcome_status || 'Open',
      body.follow_up_date || null,
      body.notes || '',
      now,
      now
    );

    const newId = Number(result.lastInsertRowid);

    // Auto-create CREATE audit log entry
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const createDiff = [
      { field: 'Initial Record', from: 'None', to: `Logged initial visit for ${body.school_name}` }
    ];

    insertAudit.run(
      newId,
      user.id,
      user.name || 'Staff',
      user.role === 'canvasser' ? 'Canvasser' : 'Admin',
      'CREATE',
      JSON.stringify(createDiff),
      now
    );

    const createdRow = db.prepare('SELECT * FROM visits WHERE id = ?').get(newId);
    const auditLogs = db.prepare('SELECT * FROM audit_logs WHERE visit_id = ? ORDER BY timestamp DESC').all(newId);

    return res.status(201).json(formatVisitRow(createdRow, auditLogs));
  } catch (error) {
    console.error('createVisit error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export function updateVisit(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const user = req.user;
    const updateData = req.body;

    const current = db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // RBAC: Canvassers can only edit their own visits
    if (user.role === 'canvasser' && current.canvasser_id !== user.id) {
      return res.status(403).json({ error: 'Access denied: cannot edit other canvassers visits' });
    }

    // Calculate structured field differences for Audit Trail
    const diff = calculateVisitDiff(current, updateData);

    const now = new Date().toISOString();
    const editorName = user.name || 'Staff';
    const editorRole = (user.role === 'canvasser') ? 'Canvasser' : 'Admin';

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

    db.prepare(`
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
    db.prepare(`
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

    const updatedRow = db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
    const auditLogs = db.prepare('SELECT * FROM audit_logs WHERE visit_id = ? ORDER BY timestamp DESC').all(id);

    return res.json(formatVisitRow(updatedRow, auditLogs));
  } catch (error) {
    console.error('updateVisit error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export function deleteVisit(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const user = req.user;

    const current = db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (user.role === 'canvasser' && current.canvasser_id !== user.id) {
      return res.status(403).json({ error: 'Access denied: cannot delete other canvasser visits' });
    }

    // Insert DELETE audit log before removing
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.id,
      user.name || 'Staff',
      user.role === 'canvasser' ? 'Canvasser' : 'Admin',
      'DELETE',
      JSON.stringify([{ field: 'Record Status', from: current.school_name, to: 'Deleted' }]),
      now
    );

    db.prepare('DELETE FROM visits WHERE id = ?').run(id);

    return res.json({ success: true, message: 'Visit deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
