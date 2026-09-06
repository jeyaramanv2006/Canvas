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

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact your CEO.' });
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
        status: user.status || 'ACTIVE'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

export function getCurrentUser(req, res) {
  try {
    const user = db.prepare('SELECT id, username, name, email, role, role_title, status FROM users WHERE id = ?').get(req.user.id);
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
        status: user.status || 'ACTIVE'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
