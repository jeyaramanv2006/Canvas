import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'murugan_super_secret_jwt_key_2026';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleTitle: user.role_title || user.roleTitle
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token, check if client passed mock token or demo fallback
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // Support demo mock tokens if passed during transition
  if (token.startsWith('mock-jwt-token-')) {
    const userId = parseInt(token.replace('mock-jwt-token-', ''), 10);
    req.user = { id: userId, role: 'canvasser', name: 'User' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export function requireAdmin(req, res, next) {
  const adminRoles = ['admin_exec', 'admin', 'manager', 'ceo', 'cfo', 'cco'];
  if (!req.user || !adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: Executive / Admin role required' });
  }
  next();
}
