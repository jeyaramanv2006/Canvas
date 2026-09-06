import bcrypt from 'bcryptjs';
import { db } from '../database/db.js';

/**
 * Format username as <name>@<role>
 */
export function formatUsername(name, role) {
  const cleanName = (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanRole = (role || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanName}@${cleanRole}`;
}

// ── 1. List Users ────────────────────────────────────────────────────────────
export function getUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT id, username, name, email, role, role_title, status, created_at 
      FROM users 
      WHERE status != 'INACTIVE'
      ORDER BY id ASC
    `).all();

    return res.json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 2. Create User (CEO Instant, Admin Queued) ───────────────────────────────
export function createUser(req, res) {
  try {
    const actor = req.user;
    const { name, role, role_title, initial_password = 'password' } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    const username = formatUsername(name, role);
    const roleTitle = role_title || `${role.toUpperCase()} Member`;

    // Check if exact username already exists
    const existing = db.prepare('SELECT id, status FROM users WHERE LOWER(username) = ?').get(username.toLowerCase());
    if (existing && existing.status !== 'INACTIVE') {
      return res.status(400).json({ error: `Username "${username}" already exists. A unique username per role is required.` });
    }

    // ── CEO: Execute immediately in database
    if (actor.role === 'ceo') {
      const passwordHash = bcrypt.hashSync(initial_password, 10);
      const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@murugan.com`;

      let newUserId;
      if (existing && existing.status === 'INACTIVE') {
        db.prepare(`
          UPDATE users SET 
            name = ?, role = ?, role_title = ?, password_hash = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(name, role.toLowerCase(), roleTitle, passwordHash, existing.id);
        newUserId = existing.id;
      } else {
        const stmt = db.prepare(`
          INSERT INTO users (username, email, password_hash, name, role, role_title, status)
          VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
        `);
        const result = stmt.run(username, email, passwordHash, name, role.toLowerCase(), roleTitle);
        newUserId = Number(result.lastInsertRowid);
      }

      // Log to AuditLogs
      db.prepare(`
        INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        actor.id,
        actor.name || 'CEO',
        'CEO',
        'CREATE',
        JSON.stringify([{ field: 'User Provisioned', from: 'None', to: `Created ${username} (${roleTitle})` }])
      );

      const createdUser = db.prepare('SELECT id, username, name, email, role, role_title, status, created_at FROM users WHERE id = ?').get(newUserId);
      return res.status(201).json({
        status: 'SUCCESS',
        message: `User ${username} created and activated immediately.`,
        user: createdUser
      });
    }

    // ── Admin: Queue into PendingUserActions for CEO approval
    const targetData = JSON.stringify({
      username,
      name,
      role: role.toLowerCase(),
      role_title: roleTitle,
      initial_password
    });

    const stmt = db.prepare(`
      INSERT INTO pending_user_actions (
        action_type, target_user_id, target_user_data,
        requested_by_id, requested_by_name, requested_by_role, status
      ) VALUES (?, NULL, ?, ?, ?, ?, 'PENDING')
    `);

    const result = stmt.run('CREATE', targetData, actor.id, actor.name || 'Admin', actor.role);

    return res.status(202).json({
      status: 'PENDING',
      message: `User creation request for "${username}" submitted to CEO for approval.`,
      action_id: Number(result.lastInsertRowid)
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 3. Update User Role (CEO Instant, Admin Queued) ──────────────────────────
export function updateUserRole(req, res) {
  try {
    const actor = req.user;
    const targetId = parseInt(req.params.id, 10);
    const { new_role, new_role_title } = req.body;

    if (!new_role) {
      return res.status(400).json({ error: 'new_role is required' });
    }

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Restriction: Non-CEO cannot modify the CEO user account
    if (targetUser.role === 'ceo' && actor.role !== 'ceo') {
      return res.status(403).json({ error: 'Unauthorized: Cannot modify the Chief Executive Officer account.' });
    }

    const newUsername = formatUsername(targetUser.name, new_role);
    const newRoleTitle = new_role_title || `${new_role.toUpperCase()} Member`;

    // Check if new username is already taken by someone else
    const conflict = db.prepare('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?').get(newUsername.toLowerCase(), targetId);
    if (conflict) {
      return res.status(400).json({ error: `Username "${newUsername}" is already in use by another account.` });
    }

    // ── CEO: Apply immediately
    if (actor.role === 'ceo') {
      db.prepare(`
        UPDATE users SET 
          username = ?, role = ?, role_title = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newUsername, new_role.toLowerCase(), newRoleTitle, targetId);

      // Audit Log
      db.prepare(`
        INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        actor.id,
        actor.name || 'CEO',
        'CEO',
        'UPDATE',
        JSON.stringify([
          { field: 'Role Changed', from: targetUser.role, to: new_role },
          { field: 'Username Changed', from: targetUser.username, to: newUsername }
        ])
      );

      const updated = db.prepare('SELECT id, username, name, email, role, role_title, status, created_at FROM users WHERE id = ?').get(targetId);
      return res.json({
        status: 'SUCCESS',
        message: `Role for ${targetUser.name} updated to ${new_role} (${newUsername}) immediately.`,
        user: updated
      });
    }

    // ── Admin: Queue into PendingUserActions
    const targetData = JSON.stringify({
      user_id: targetId,
      user_name: targetUser.name,
      current_role: targetUser.role,
      new_role: new_role.toLowerCase(),
      current_username: targetUser.username,
      new_username: newUsername,
      new_role_title: newRoleTitle
    });

    const stmt = db.prepare(`
      INSERT INTO pending_user_actions (
        action_type, target_user_id, target_user_data,
        requested_by_id, requested_by_name, requested_by_role, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `);

    const result = stmt.run('ROLE_CHANGE', targetId, targetData, actor.id, actor.name || 'Admin', actor.role);

    return res.status(202).json({
      status: 'PENDING',
      message: `Role change for "${targetUser.name}" to ${new_role} submitted to CEO for approval.`,
      action_id: Number(result.lastInsertRowid)
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 4. Delete User (CEO Instant, Admin Queued) ───────────────────────────────
export function deleteUser(req, res) {
  try {
    const actor = req.user;
    const targetId = parseInt(req.params.id, 10);

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Restriction: Cannot delete CEO
    if (targetUser.role === 'ceo') {
      return res.status(403).json({ error: 'Protected Account: The Chief Executive Officer cannot be deleted.' });
    }

    // ── CEO: Execute delete immediately
    if (actor.role === 'ceo') {
      db.prepare(`UPDATE users SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(targetId);

      // Audit Log
      db.prepare(`
        INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        actor.id,
        actor.name || 'CEO',
        'CEO',
        'DELETE',
        JSON.stringify([{ field: 'Account Deactivated', from: targetUser.username, to: 'INACTIVE' }])
      );

      return res.json({
        status: 'SUCCESS',
        message: `User ${targetUser.username} deactivated immediately.`
      });
    }

    // ── Admin: Queue into PendingUserActions
    const targetData = JSON.stringify({
      user_id: targetId,
      username: targetUser.username,
      name: targetUser.name,
      role: targetUser.role
    });

    const stmt = db.prepare(`
      INSERT INTO pending_user_actions (
        action_type, target_user_id, target_user_data,
        requested_by_id, requested_by_name, requested_by_role, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `);

    const result = stmt.run('DELETE', targetId, targetData, actor.id, actor.name || 'Admin', actor.role);

    return res.status(202).json({
      status: 'PENDING',
      message: `Deletion request for "${targetUser.username}" submitted to CEO for approval.`,
      action_id: Number(result.lastInsertRowid)
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 5. List Pending Approvals (CEO Only) ──────────────────────────────────────
export function getPendingApprovals(req, res) {
  try {
    const rows = db.prepare(`
      SELECT * FROM pending_user_actions 
      WHERE status = 'PENDING' 
      ORDER BY created_at DESC
    `).all();

    const formatted = rows.map(r => ({
      id: r.id,
      action_type: r.action_type,
      target_user_id: r.target_user_id,
      target_user_data: typeof r.target_user_data === 'string'
        ? JSON.parse(r.target_user_data || '{}')
        : (r.target_user_data || {}),
      requested_by_id: r.requested_by_id,
      requested_by_name: r.requested_by_name,
      requested_by_role: r.requested_by_role,
      status: r.status,
      created_at: r.created_at
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('getPendingApprovals error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 6. Decide Pending Approval (Approve / Reject by CEO) ─────────────────────
export function decideApproval(req, res) {
  try {
    const actor = req.user;
    const actionId = parseInt(req.params.id, 10);
    const { decision, notes = '' } = req.body; // 'APPROVE' or 'REJECT'

    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision. Must be "APPROVE" or "REJECT".' });
    }

    const action = db.prepare('SELECT * FROM pending_user_actions WHERE id = ?').get(actionId);
    if (!action) {
      return res.status(404).json({ error: 'Pending action not found' });
    }

    if (action.status !== 'PENDING') {
      return res.status(400).json({ error: `This action has already been ${action.status.toLowerCase()}.` });
    }

    const targetData = typeof action.target_user_data === 'string'
      ? JSON.parse(action.target_user_data || '{}')
      : (action.target_user_data || {});

    // ── REJECT CASE
    if (decision === 'REJECT') {
      db.prepare(`
        UPDATE pending_user_actions SET 
          status = 'REJECTED', reviewed_by_id = ?, reviewed_by_name = ?, reviewed_at = CURRENT_TIMESTAMP, notes = ?
        WHERE id = ?
      `).run(actor.id, actor.name || 'CEO', notes, actionId);

      // Log rejection in AuditLogs
      db.prepare(`
        INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        actor.id,
        actor.name || 'CEO',
        'CEO',
        'UPDATE',
        JSON.stringify([{ field: 'Approval Decision', from: `Pending ${action.action_type}`, to: `REJECTED by CEO (${notes || 'No note'})` }])
      );

      return res.json({
        status: 'REJECTED',
        message: `Request #${actionId} (${action.action_type}) has been rejected and discarded.`
      });
    }

    // ── APPROVE CASE
    if (action.action_type === 'CREATE') {
      const passwordHash = bcrypt.hashSync(targetData.initial_password || 'password', 10);
      const email = `${targetData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@murugan.com`;

      const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(targetData.username.toLowerCase());
      if (existing) {
        db.prepare(`
          UPDATE users SET 
            name = ?, role = ?, role_title = ?, password_hash = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(targetData.name, targetData.role, targetData.role_title, passwordHash, existing.id);
      } else {
        db.prepare(`
          INSERT INTO users (username, email, password_hash, name, role, role_title, status)
          VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
        `).run(targetData.username, email, passwordHash, targetData.name, targetData.role, targetData.role_title);
      }
    } else if (action.action_type === 'ROLE_CHANGE') {
      db.prepare(`
        UPDATE users SET 
          username = ?, role = ?, role_title = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(targetData.new_username, targetData.new_role, targetData.new_role_title, targetData.user_id);
    } else if (action.action_type === 'DELETE') {
      db.prepare(`UPDATE users SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(targetData.user_id);
    }

    // Update pending action record to APPROVED
    db.prepare(`
      UPDATE pending_user_actions SET 
        status = 'APPROVED', reviewed_by_id = ?, reviewed_by_name = ?, reviewed_at = CURRENT_TIMESTAMP, notes = ?
      WHERE id = ?
    `).run(actor.id, actor.name || 'CEO', notes, actionId);

    // Record in AuditLogs
    db.prepare(`
      INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      actor.id,
      actor.name || 'CEO',
      'CEO',
      action.action_type,
      JSON.stringify([{ field: 'CEO Approval Executed', from: `Pending ${action.action_type}`, to: `APPROVED & Applied to Database: ${JSON.stringify(targetData)}` }])
    );

    return res.json({
      status: 'APPROVED',
      message: `Request #${actionId} (${action.action_type}) approved and applied to the database.`
    });
  } catch (error) {
    console.error('decideApproval error:', error);
    return res.status(500).json({ error: error.message });
  }
}
