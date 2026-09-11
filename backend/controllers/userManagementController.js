import bcrypt from 'bcryptjs';
import { db } from '../database/db.js';

/**
 * Format username as <name>@<role>
 */
export function formatUsername(name, role) {
  const cleanName = (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const rawRole = (role || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const roleMap = {
    'canvasser': 'cvs',
    'cvs': 'cvs',
    'field': 'cvs',
    'admin_exec': 'admin',
    'adminexec': 'admin',
    'admin': 'admin',
    'ceo': 'ceo',
    'cfo': 'cfo',
    'cco': 'cco'
  };

  const cleanRole = roleMap[rawRole] || rawRole;
  return `${cleanName}@${cleanRole}`;
}

// ── 1. List Users ────────────────────────────────────────────────────────────
export async function getUsers(req, res) {
  try {
    const users = await db.prepare(`
      SELECT id, username, name, email, role, role_title, status, requires_password_reset, created_at 
      FROM users 
      WHERE status != 'DELETED'
      ORDER BY id ASC
    `).all();

    return res.json((users || []).map(u => ({
      ...u,
      requires_password_reset: Boolean(u.requires_password_reset)
    })));
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 2. Create User (CEO Instant, Admin Queued) ───────────────────────────────
export async function createUser(req, res) {
  try {
    const actor = req.user;
    const { name, role, role_title } = req.body;
    const initial_password = req.body.initial_password || req.body.password || 'password';

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    const username = formatUsername(name, role);
    const roleTitle = role_title || `${role.toUpperCase()} Member`;

    // Check if exact username already exists and is active/paused
    const existing = await db.prepare('SELECT id, status FROM users WHERE LOWER(username) = ?').get(username.toLowerCase());
    if (existing) {
      if (existing.status === 'DELETED') {
        // Clean up legacy soft-deleted record so it can be re-created fresh
        await db.prepare('DELETE FROM users WHERE id = ?').run(existing.id);
      } else {
        return res.status(400).json({ error: `Username "${username}" already exists. A unique username per role is required.` });
      }
    }

    // ── CEO: Execute immediately in database
    if (actor.role === 'ceo') {
      const passwordHash = bcrypt.hashSync(initial_password, 10);
      const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@murugan.com`;

      const stmt = db.prepare(`
        INSERT INTO users (username, email, password_hash, name, role, role_title, status, requires_password_reset)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 0)
      `);
      const result = await stmt.run(username, email, passwordHash, name, role.toLowerCase(), roleTitle);
      const latestUser = await db.prepare('SELECT id FROM users ORDER BY id DESC LIMIT 1').get();
      const newUserId = result.lastInsertRowid || (latestUser ? latestUser.id : 1);

      // Log to AuditLogs
      await db.prepare(`
        INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        actor.id,
        actor.name || 'CEO',
        'CEO',
        'CREATE',
        JSON.stringify([{ field: 'User Provisioned', from: 'None', to: `Created ${username} (${roleTitle})` }])
      );

      const createdUser = await db.prepare('SELECT id, username, name, email, role, role_title, status, requires_password_reset, created_at FROM users WHERE id = ?').get(newUserId);
      return res.status(201).json({
        status: 'SUCCESS',
        message: `User ${username} created and activated immediately.`,
        user: {
          ...createdUser,
          requires_password_reset: Boolean(createdUser.requires_password_reset)
        }
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

    const result = await stmt.run('CREATE', targetData, actor.id, actor.name || 'Admin', actor.role);
    const latestAction = await db.prepare('SELECT id FROM pending_user_actions ORDER BY id DESC LIMIT 1').get();
    const actionId = result.lastInsertRowid || (latestAction ? latestAction.id : 1);

    return res.status(202).json({
      status: 'PENDING',
      message: `User creation request for "${username}" submitted to CEO for approval.`,
      action_id: Number(actionId)
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 3. Update User Role (CEO Instant, Admin Queued) ──────────────────────────
export async function updateUserRole(req, res) {
  try {
    const actor = req.user;
    const targetId = parseInt(req.params.id, 10);
    const { new_role, new_role_title } = req.body;

    if (!new_role) {
      return res.status(400).json({ error: 'new_role is required' });
    }

    const targetUser = await db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Restriction: Cannot modify the CEO user account role
    if (targetUser.role === 'ceo') {
      return res.status(403).json({ error: 'Protected Account: The Chief Executive Officer role cannot be changed.' });
    }

    const newUsername = formatUsername(targetUser.name, new_role);
    const newRoleTitle = new_role_title || `${new_role.toUpperCase()} Member`;

    // Check if new username is already taken by someone else
    const conflict = await db.prepare('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?').get(newUsername.toLowerCase(), targetId);
    if (conflict) {
      return res.status(400).json({ error: `Username "${newUsername}" is already in use by another account.` });
    }

    // ── CEO: Apply immediately
    if (actor.role === 'ceo') {
      await db.prepare(`
        UPDATE users SET 
          username = ?, role = ?, role_title = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newUsername, new_role.toLowerCase(), newRoleTitle, targetId);

      // Audit Log
      await db.prepare(`
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

      const updated = await db.prepare('SELECT id, username, name, email, role, role_title, status, requires_password_reset, created_at FROM users WHERE id = ?').get(targetId);
      return res.json({
        status: 'SUCCESS',
        message: `Role for ${targetUser.name} updated to ${new_role} (${newUsername}) immediately.`,
        user: {
          ...updated,
          requires_password_reset: Boolean(updated.requires_password_reset)
        }
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

    const result = await stmt.run('ROLE_CHANGE', targetId, targetData, actor.id, actor.name || 'Admin', actor.role);
    const latestAction = await db.prepare('SELECT id FROM pending_user_actions ORDER BY id DESC LIMIT 1').get();
    const actionId = result.lastInsertRowid || (latestAction ? latestAction.id : 1);

    return res.status(202).json({
      status: 'PENDING',
      message: `Role change for "${targetUser.name}" to ${new_role} submitted to CEO for approval.`,
      action_id: Number(actionId)
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 4. Delete User (CEO Instant, Admin Queued) ───────────────────────────────
export async function deleteUser(req, res) {
  try {
    const actor = req.user;
    const targetId = parseInt(req.params.id, 10);

    const targetUser = await db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Restriction: Cannot delete CEO
    if (targetUser.role === 'ceo') {
      return res.status(403).json({ error: 'Protected Account: The Chief Executive Officer cannot be deleted.' });
    }

    // ── CEO: Execute delete immediately (permanently purge from database)
    if (actor.role === 'ceo') {
      await db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
      await db.prepare('DELETE FROM pending_user_actions WHERE target_user_id = ?').run(targetId);

      // Audit Log
      await db.prepare(`
        INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        actor.id,
        actor.name || 'CEO',
        'CEO',
        'DELETE',
        JSON.stringify([{ field: 'Account Purged', from: targetUser.username, to: 'Permanently Deleted from Database' }])
      );

      return res.json({
        status: 'SUCCESS',
        message: `User ${targetUser.username} permanently deleted from database.`
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

    const result = await stmt.run('DELETE', targetId, targetData, actor.id, actor.name || 'Admin', actor.role);
    const latestAction = await db.prepare('SELECT id FROM pending_user_actions ORDER BY id DESC LIMIT 1').get();
    const actionId = result.lastInsertRowid || (latestAction ? latestAction.id : 1);

    return res.status(202).json({
      status: 'PENDING',
      message: `Deletion request for "${targetUser.username}" submitted to CEO for approval.`,
      action_id: Number(actionId)
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 5. Pause User / Stop (CEO Instant, Admin Queued) ────────────────────────
export async function pauseUser(req, res) {
  try {
    const actor = req.user;
    const targetId = parseInt(req.params.id, 10);

    const targetUser = await db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'ceo') {
      return res.status(403).json({ error: 'Protected Account: The Chief Executive Officer cannot be paused.' });
    }

    // ── CEO: Execute pause immediately
    if (actor.role === 'ceo') {
      await db.prepare(`UPDATE users SET status = 'PAUSED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(targetId);

      await db.prepare(`
        INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        actor.id,
        actor.name || 'CEO',
        'CEO',
        'UPDATE',
        JSON.stringify([{ field: 'Account Paused', from: targetUser.status, to: 'PAUSED' }])
      );

      return res.json({
        status: 'SUCCESS',
        message: `User ${targetUser.username} paused. Login access is temporarily paused, progress remains intact.`
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

    const result = await stmt.run('PAUSE', targetId, targetData, actor.id, actor.name || 'Admin', actor.role);
    const latestAction = await db.prepare('SELECT id FROM pending_user_actions ORDER BY id DESC LIMIT 1').get();
    const actionId = result.lastInsertRowid || (latestAction ? latestAction.id : 1);

    return res.status(202).json({
      status: 'PENDING',
      message: `Pause request for "${targetUser.username}" submitted to CEO for approval.`,
      action_id: Number(actionId)
    });
  } catch (error) {
    console.error('pauseUser error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 6. Resume User (CEO Instant, Admin Queued) ───────────────────────────────
export async function resumeUser(req, res) {
  try {
    const actor = req.user;
    const targetId = parseInt(req.params.id, 10);

    const targetUser = await db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ── CEO: Execute resume immediately
    if (actor.role === 'ceo') {
      await db.prepare(`UPDATE users SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(targetId);

      await db.prepare(`
        INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        actor.id,
        actor.name || 'CEO',
        'CEO',
        'UPDATE',
        JSON.stringify([{ field: 'Account Resumed', from: targetUser.status, to: 'ACTIVE' }])
      );

      return res.json({
        status: 'SUCCESS',
        message: `User ${targetUser.username} resumed. Login access has been restored.`
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

    const result = await stmt.run('RESUME', targetId, targetData, actor.id, actor.name || 'Admin', actor.role);
    const latestAction = await db.prepare('SELECT id FROM pending_user_actions ORDER BY id DESC LIMIT 1').get();
    const actionId = result.lastInsertRowid || (latestAction ? latestAction.id : 1);

    return res.status(202).json({
      status: 'PENDING',
      message: `Resume request for "${targetUser.username}" submitted to CEO for approval.`,
      action_id: Number(actionId)
    });
  } catch (error) {
    console.error('resumeUser error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 7. Trigger Password Reset (Instant for both Admin & CEO) ───────────────────
export async function triggerPasswordReset(req, res) {
  try {
    const actor = req.user;
    const targetId = parseInt(req.params.id, 10);

    const targetUser = await db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Set temporary password to 'reset' and enforce password reset on next login
    const resetHash = bcrypt.hashSync('reset', 10);
    await db.prepare(`
      UPDATE users SET 
        password_hash = ?, 
        requires_password_reset = 1, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(resetHash, targetId);

    await db.prepare(`
      INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      actor.id,
      actor.name || 'Admin',
      actor.role || 'Admin',
      'UPDATE',
      JSON.stringify([{ field: 'Password Reset', from: 'Active Password', to: `Temporary password set to 'reset' for ${targetUser.username}` }])
    );

    return res.json({
      status: 'SUCCESS',
      message: `Password reset for ${targetUser.username}. Temporary password is set to "reset". The user can now log in with "reset" and choose a new password.`
    });
  } catch (error) {
    console.error('triggerPasswordReset error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 8. List Pending Approvals (CEO Only) ──────────────────────────────────────
export async function getPendingApprovals(req, res) {
  try {
    const rows = await db.prepare(`
      SELECT * FROM pending_user_actions 
      WHERE status = 'PENDING' 
      ORDER BY created_at DESC
    `).all();

    const formatted = (rows || []).map(r => ({
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

// ── 9. Decide Pending Approval (Approve / Reject by CEO) ─────────────────────
export async function decideApproval(req, res) {
  try {
    const actor = req.user;
    const actionId = parseInt(req.params.id, 10);
    const { decision, notes = '' } = req.body;

    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision. Must be "APPROVE" or "REJECT".' });
    }

    const action = await db.prepare('SELECT * FROM pending_user_actions WHERE id = ?').get(actionId);
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
      await db.prepare(`
        UPDATE pending_user_actions SET 
          status = 'REJECTED', reviewed_by_id = ?, reviewed_by_name = ?, reviewed_at = CURRENT_TIMESTAMP, notes = ?
        WHERE id = ?
      `).run(actor.id, actor.name || 'CEO', notes, actionId);

      await db.prepare(`
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
        message: `Request #${actionId} (${action.action_type}) has been rejected.`
      });
    }

    // ── APPROVE CASE
    if (action.action_type === 'CREATE') {
      const initialPassword = targetData.initial_password || targetData.password || 'password';
      const passwordHash = bcrypt.hashSync(initialPassword, 10);
      const email = `${targetData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@murugan.com`;

      const existing = await db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(targetData.username.toLowerCase());
      if (existing) {
        await db.prepare(`
          UPDATE users SET 
            name = ?, role = ?, role_title = ?, password_hash = ?, status = 'ACTIVE', requires_password_reset = 0, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(targetData.name, targetData.role, targetData.role_title, passwordHash, existing.id);
      } else {
        await db.prepare(`
          INSERT INTO users (username, email, password_hash, name, role, role_title, status, requires_password_reset)
          VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 0)
        `).run(targetData.username, email, passwordHash, targetData.name, targetData.role, targetData.role_title);
      }
    } else if (action.action_type === 'ROLE_CHANGE') {
      await db.prepare(`
        UPDATE users SET 
          username = ?, role = ?, role_title = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(targetData.new_username, targetData.new_role, targetData.new_role_title, targetData.user_id);
    } else if (action.action_type === 'DELETE') {
      await db.prepare('DELETE FROM users WHERE id = ?').run(targetData.user_id);
      await db.prepare('DELETE FROM pending_user_actions WHERE target_user_id = ?').run(targetData.user_id);
    } else if (action.action_type === 'PAUSE') {
      await db.prepare(`UPDATE users SET status = 'PAUSED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(targetData.user_id);
    } else if (action.action_type === 'RESUME') {
      await db.prepare(`UPDATE users SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(targetData.user_id);
    } else if (action.action_type === 'SCHOOL_CREATE') {
      await db.prepare(`
        INSERT INTO master_schools 
        (id, school_name, district, block_or_cluster, zone, board, area, student_strength, contact_person, phone, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(
        targetData.id,
        targetData.school_name,
        targetData.district,
        targetData.block_or_cluster || 'General Block',
        targetData.zone || 'Tamil Nadu',
        targetData.board || 'Matriculation',
        targetData.area || '',
        targetData.student_strength || null,
        targetData.contact_person || null,
        targetData.phone || null,
        targetData.priority || 'Medium'
      );
    } else if (action.action_type === 'SCHOOL_EDIT') {
      await db.prepare(`
        UPDATE master_schools SET
          school_name = COALESCE(?, school_name),
          district = COALESCE(?, district),
          block_or_cluster = COALESCE(?, block_or_cluster),
          zone = COALESCE(?, zone),
          board = COALESCE(?, board),
          area = COALESCE(?, area),
          student_strength = COALESCE(?, student_strength),
          contact_person = COALESCE(?, contact_person),
          phone = COALESCE(?, phone),
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        targetData.school_name,
        targetData.district,
        targetData.block_or_cluster,
        targetData.zone,
        targetData.board,
        targetData.area,
        targetData.student_strength,
        targetData.contact_person,
        targetData.phone,
        targetData.priority,
        targetData.status,
        targetData.id
      );
    } else if (action.action_type === 'SCHOOL_DELETE') {
      await db.prepare(`DELETE FROM master_schools WHERE id = ?`).run(targetData.id);
    }

    // Update pending action record to APPROVED
    await db.prepare(`
      UPDATE pending_user_actions SET 
        status = 'APPROVED', reviewed_by_id = ?, reviewed_by_name = ?, reviewed_at = CURRENT_TIMESTAMP, notes = ?
      WHERE id = ?
    `).run(actor.id, actor.name || 'CEO', notes, actionId);

    // Record in AuditLogs
    await db.prepare(`
      INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      actor.id,
      actor.name || 'CEO',
      'CEO',
      action.action_type,
      JSON.stringify([{ field: 'CEO Approval Executed', from: `Pending ${action.action_type}`, to: `APPROVED & Applied to Database` }])
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
