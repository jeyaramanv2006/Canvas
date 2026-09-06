import { db } from '../database/db.js';

// ── GET /api/master-schools ──────────────────────────────────────────────────
export function getMasterSchools(req, res) {
  try {
    const { q, district, zone, board, limit = 50, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    let whereClauses = ["status = 'ACTIVE'"];
    let params = [];

    if (q && q.trim()) {
      whereClauses.push("(school_name LIKE ? OR area LIKE ? OR block_or_cluster LIKE ? OR id LIKE ?)");
      const term = `%${q.trim()}%`;
      params.push(term, term, term, term);
    }

    if (district && district !== 'all' && district.trim()) {
      whereClauses.push("district = ?");
      params.push(district.trim());
    }

    if (zone && zone !== 'all' && zone.trim()) {
      whereClauses.push("zone = ?");
      params.push(zone.trim());
    }

    if (board && board !== 'all' && board.trim()) {
      whereClauses.push("board LIKE ?");
      params.push(`%${board.trim()}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Count total matching
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM master_schools ${whereSql}`).get(...params);
    const total = countRow ? countRow.total : 0;

    // Fetch paginated rows
    const queryParams = [...params, parseInt(limit, 10), offset];
    const schools = db.prepare(`
      SELECT * FROM master_schools 
      ${whereSql}
      ORDER BY district ASC, school_name ASC
      LIMIT ? OFFSET ?
    `).all(...queryParams);

    return res.json({
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      schools
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── GET /api/master-schools/districts ────────────────────────────────────────
export function getSchoolDistricts(req, res) {
  try {
    const rows = db.prepare(`
      SELECT DISTINCT district FROM master_schools WHERE district IS NOT NULL AND district != '' ORDER BY district ASC
    `).all();
    return res.json(rows.map(r => r.district));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── GET /api/master-schools/:id ─────────────────────────────────────────────
export function getMasterSchoolById(req, res) {
  try {
    const school = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(req.params.id);
    if (!school) {
      return res.status(404).json({ error: 'School not found in master database' });
    }
    return res.json(school);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── POST /api/master-schools ────────────────────────────────────────────────
// CEO: directly creates; Admin: submits approval request to CEO
export function createMasterSchool(req, res) {
  try {
    const { school_name, district, block_or_cluster, zone, board, area, student_strength, contact_person, phone, priority } = req.body;
    
    if (!school_name || !district) {
      return res.status(400).json({ error: 'School Name and District are required' });
    }

    const distCode = (district || 'SCH').replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'SCH';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `SCH-${distCode}-${randomSuffix}`;

    const schoolData = {
      id: newId,
      school_name: school_name.trim(),
      district: district.trim(),
      block_or_cluster: (block_or_cluster || 'General Block').trim(),
      zone: (zone || 'Tamil Nadu').trim(),
      board: (board || 'Matriculation').trim(),
      area: (area || '').trim(),
      student_strength: parseInt(student_strength, 10) || null,
      contact_person: contact_person ? contact_person.trim() : null,
      phone: phone ? phone.trim() : null,
      priority: priority || 'Medium'
    };

    // If CEO, insert directly
    if (req.user.role === 'ceo') {
      db.prepare(`
        INSERT INTO master_schools 
        (id, school_name, district, block_or_cluster, zone, board, area, student_strength, contact_person, phone, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(
        schoolData.id,
        schoolData.school_name,
        schoolData.district,
        schoolData.block_or_cluster,
        schoolData.zone,
        schoolData.board,
        schoolData.area,
        schoolData.student_strength,
        schoolData.contact_person,
        schoolData.phone,
        schoolData.priority
      );

      const created = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(schoolData.id);
      return res.status(201).json({
        success: true,
        message: 'School added directly to Master Catalog by CEO',
        school: created,
        requiresApproval: false
      });
    }

    // If Admin, stage in Pending Approvals for CEO Review
    const stmt = db.prepare(`
      INSERT INTO pending_user_actions 
      (action_type, target_user_id, target_user_data, requested_by_id, requested_by_name, requested_by_role, status)
      VALUES (?, NULL, ?, ?, ?, ?, 'PENDING')
    `);

    const result = stmt.run(
      'SCHOOL_CREATE',
      JSON.stringify(schoolData),
      req.user.id,
      req.user.name || 'Admin',
      req.user.role || 'admin'
    );

    return res.status(202).json({
      success: true,
      message: 'School creation request submitted to CEO for approval',
      approvalId: Number(result.lastInsertRowid),
      requiresApproval: true,
      school: schoolData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── PUT /api/master-schools/:id ─────────────────────────────────────────────
// CEO: directly updates; Admin: submits approval request to CEO
export function updateMasterSchool(req, res) {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'School not found in master database' });
    }

    const { school_name, district, block_or_cluster, zone, board, area, student_strength, contact_person, phone, priority, status } = req.body;

    const updatedData = {
      id,
      school_name: school_name !== undefined ? school_name.trim() : existing.school_name,
      district: district !== undefined ? district.trim() : existing.district,
      block_or_cluster: block_or_cluster !== undefined ? block_or_cluster.trim() : existing.block_or_cluster,
      zone: zone !== undefined ? zone.trim() : existing.zone,
      board: board !== undefined ? board.trim() : existing.board,
      area: area !== undefined ? area.trim() : existing.area,
      student_strength: student_strength !== undefined ? parseInt(student_strength, 10) : existing.student_strength,
      contact_person: contact_person !== undefined ? contact_person.trim() : existing.contact_person,
      phone: phone !== undefined ? phone.trim() : existing.phone,
      priority: priority !== undefined ? priority : existing.priority,
      status: status !== undefined ? status : existing.status,
      previous: existing
    };

    // If CEO, update directly
    if (req.user.role === 'ceo') {
      db.prepare(`
        UPDATE master_schools SET
          school_name = ?,
          district = ?,
          block_or_cluster = ?,
          zone = ?,
          board = ?,
          area = ?,
          student_strength = ?,
          contact_person = ?,
          phone = ?,
          priority = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        updatedData.school_name,
        updatedData.district,
        updatedData.block_or_cluster,
        updatedData.zone,
        updatedData.board,
        updatedData.area,
        updatedData.student_strength,
        updatedData.contact_person,
        updatedData.phone,
        updatedData.priority,
        updatedData.status,
        id
      );

      const school = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(id);
      return res.json({
        success: true,
        message: 'School updated directly by CEO',
        school,
        requiresApproval: false
      });
    }

    // If Admin, submit for CEO Approval
    const stmt = db.prepare(`
      INSERT INTO pending_user_actions 
      (action_type, target_user_id, target_user_data, requested_by_id, requested_by_name, requested_by_role, status)
      VALUES (?, NULL, ?, ?, ?, ?, 'PENDING')
    `);

    const result = stmt.run(
      'SCHOOL_EDIT',
      JSON.stringify(updatedData),
      req.user.id,
      req.user.name || 'Admin',
      req.user.role || 'admin'
    );

    return res.status(202).json({
      success: true,
      message: 'School modification request submitted to CEO for approval',
      approvalId: Number(result.lastInsertRowid),
      requiresApproval: true,
      school: updatedData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── DELETE /api/master-schools/:id ──────────────────────────────────────────
// CEO: directly deletes; Admin: submits approval request to CEO
export function deleteMasterSchool(req, res) {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM master_schools WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'School not found in master database' });
    }

    // If CEO, delete directly
    if (req.user.role === 'ceo') {
      db.prepare('DELETE FROM master_schools WHERE id = ?').run(id);
      return res.json({
        success: true,
        message: `School "${existing.school_name}" deleted directly by CEO`,
        deletedId: id,
        requiresApproval: false
      });
    }

    // If Admin, submit for CEO Approval
    const stmt = db.prepare(`
      INSERT INTO pending_user_actions 
      (action_type, target_user_id, target_user_data, requested_by_id, requested_by_name, requested_by_role, status)
      VALUES (?, NULL, ?, ?, ?, ?, 'PENDING')
    `);

    const result = stmt.run(
      'SCHOOL_DELETE',
      JSON.stringify({ id, school_name: existing.school_name, district: existing.district }),
      req.user.id,
      req.user.name || 'Admin',
      req.user.role || 'admin'
    );

    return res.status(202).json({
      success: true,
      message: `School deletion request for "${existing.school_name}" submitted to CEO for approval`,
      approvalId: Number(result.lastInsertRowid),
      requiresApproval: true
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
