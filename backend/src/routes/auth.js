const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { protect } = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'ai_study_planner_secret_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const safeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = db.users.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = db.users.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      avatar: '',
      studyStreak: 0,
      lastStudyDate: null,
      totalStudyHours: 0,
      setupComplete: false,
      settings: {
        pomodoroFocusMinutes: 25,
        pomodoroShortBreak: 5,
        pomodoroLongBreak: 15,
        dailyStudyLimitHours: 6,
        theme: 'dark',
        notificationsEnabled: true
      }
    });

    res.status(201).json({ user: safeUser(user), token: generateToken(user._id) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = db.users.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ user: safeUser(user), token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  const user = db.users.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: safeUser(user) });
});

// PUT /api/auth/profile
router.put('/profile', protect, (req, res) => {
  const { name, avatar } = req.body;
  const updates = {};
  if (name) updates.name = name.trim();
  if (avatar !== undefined) updates.avatar = avatar;
  const user = db.users.updateById(req.user._id, updates);
  res.json({ user: safeUser(user) });
});

// PUT /api/auth/password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = db.users.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const hashed = await bcrypt.hash(newPassword, 12);
    db.users.updateById(req.user._id, { password: hashed });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
