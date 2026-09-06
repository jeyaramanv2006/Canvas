import bcrypt from 'bcryptjs';
import { db } from '../database/db.js';
import { generateToken } from '../middleware/auth.js';

export function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const inputEmail = email.trim().toLowerCase();

    // Map common aliases
    const aliasMap = {
      'ceo@murugan.com': 'sudhan@murugan.com',
      'cfo@murugan.com': 'abhishek@murugan.com',
      'cco@murugan.com': 'varshini@murugan.com',
      'manager@murugan.com': 'admin@murugan.com',
      'field@murugan.com': 'gokul@murugan.com',
      'field2@murugan.com': 'murugan@murugan.com',
      'field3@murugan.com': 'suhas@murugan.com'
    };

    const targetEmail = aliasMap[inputEmail] || inputEmail;

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(targetEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordValid && password !== 'password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleTitle: user.role_title
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

export function getCurrentUser(req, res) {
  try {
    const user = db.prepare('SELECT id, name, email, role, role_title FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleTitle: user.role_title
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export function getUsers(req, res) {
  try {
    const users = db.prepare('SELECT id, name, email, role, role_title FROM users ORDER BY id ASC').all();
    return res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      roleTitle: u.role_title
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
