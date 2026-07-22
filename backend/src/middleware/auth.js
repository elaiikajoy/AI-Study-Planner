const jwt = require('jsonwebtoken');
const db = require('../config/database');

const protect = (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ error: 'Not authorized, no token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ai_study_planner_secret_2024');
    const user = db.users.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User no longer exists' });

    // Attach user without password
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch {
    return res.status(401).json({ error: 'Not authorized, token invalid' });
  }
};

module.exports = { protect };
