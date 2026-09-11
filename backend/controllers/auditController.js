import { db } from '../database/db.js';

export async function getAuditLogs(req, res) {
  try {
    const { visit_id, actor_id, action, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        a.*,
        v.school_name,
        v.district
      FROM audit_logs a
      LEFT JOIN visits v ON a.visit_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (visit_id) {
      query += ' AND a.visit_id = ?';
      params.push(Number(visit_id));
    }

    if (actor_id) {
      query += ' AND a.actor_id = ?';
      params.push(Number(actor_id));
    }

    if (action) {
      query += ' AND a.action = ?';
      params.push(action);
    }

    query += ' ORDER BY a.timestamp DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = await db.prepare(query).all(...params);

    const formatted = (rows || []).map(r => ({
      id: r.id,
      visit_id: r.visit_id,
      school_name: r.school_name || `Visit #${r.visit_id}`,
      district: r.district || 'N/A',
      actor_id: r.actor_id,
      actor_name: r.actor_name,
      actor_role: r.actor_role,
      action: r.action,
      changed_fields: typeof r.changed_fields === 'string'
        ? JSON.parse(r.changed_fields || '[]')
        : (r.changed_fields || []),
      timestamp: r.timestamp
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ error: error.message });
  }
}
