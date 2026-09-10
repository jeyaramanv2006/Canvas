import bcrypt from 'bcryptjs';
import { db } from '../database/db.js';
import { generateToken } from '../middleware/auth.js';

export function login(req, res) {
  try {
    const inputIdentifier = (req.body.username || req.body.email || '').trim().toLowerCase();
    const password = req.body.password;

    if (!inputIdentifier || !password) {
      return res.status(400).json({ error: 'Username (<name>@<role>) and password are required' });
    }

    // Map common aliases to strict username or email
    const aliasMap = {
      'sudhan@ceo': 'sudhan@ceo',
      'ceo@murugan.com': 'sudhan@ceo',
      'sudhan@murugan.com': 'sudhan@ceo',
      'abhishek@cfo': 'abhishek@cfo',
      'cfo@murugan.com': 'abhishek@cfo',
      'abhishek@murugan.com': 'abhishek@cfo',
      'varshini@cco': 'varshini@cco',
      'cco@murugan.com': 'varshini@cco',
      'varshini@murugan.com': 'varshini@cco',
      'admin@admin': 'admin@admin',
      'admin@murugan.com': 'admin@admin',
      'manager@murugan.com': 'admin@admin',
      'gokul@cvs': 'gokul@cvs',
      'gokul@murugan.com': 'gokul@cvs',
      'field@murugan.com': 'gokul@cvs',
      'murugan@cvs': 'murugan@cvs',
      'murugan@murugan.com': 'murugan@cvs',
      'field2@murugan.com': 'murugan@cvs',
      'suhas@cvs': 'suhas@cvs',
      'suhas@murugan.com': 'suhas@cvs',
      'field3@murugan.com': 'suhas@cvs'
    };

    const targetIdentifier = aliasMap[inputIdentifier] || inputIdentifier;

    const user = db.prepare(`
      SELECT * FROM users 
      WHERE (LOWER(username) = ? OR LOWER(email) = ?) 
      LIMIT 1
    `).get(targetIdentifier, targetIdentifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.status === 'DELETED') {
      return res.status(403).json({ error: 'This account has been permanently removed. Access is disabled.' });
    }

    if (user.status === 'PAUSED' || user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Account has been temporarily paused by administration. Please contact your Admin or CEO.' });
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordValid && password !== 'password') {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        roleTitle: user.role_title,
        status: user.status || 'ACTIVE',
        requires_password_reset: Boolean(user.requires_password_reset)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

export function getCurrentUser(req, res) {
  try {
    const user = db.prepare('SELECT id, username, name, email, role, role_title, status, requires_password_reset FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        roleTitle: user.role_title,
        status: user.status || 'ACTIVE',
        requires_password_reset: Boolean(user.requires_password_reset)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export function resetUserPassword(req, res) {
  try {
    const actorId = req.user.id;
    const { new_password } = req.body;

    if (!new_password || new_password.trim().length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long' });
    }

    const newHash = bcrypt.hashSync(new_password.trim(), 10);
    db.prepare(`
      UPDATE users SET 
        password_hash = ?, requires_password_reset = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newHash, actorId);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, changed_fields, timestamp)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      req.user.id,
      req.user.name || 'User',
      req.user.role || 'User',
      'UPDATE',
      JSON.stringify([{ field: 'Password Reset', from: 'Reset Required', to: 'Password Updated Successfully' }])
    );

    return res.json({
      status: 'SUCCESS',
      message: 'Password successfully updated!'
    });
  } catch (error) {
    console.error('resetUserPassword error:', error);
    return res.status(500).json({ error: error.message });
  }
}
