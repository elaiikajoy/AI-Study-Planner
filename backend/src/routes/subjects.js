const express = require('express');
const db = require('../config/database');
const { protect } = require('../middleware/auth');
const { generateSchedule } = require('../services/schedulingEngine');
const router = express.Router();

router.use(protect);

// GET /api/subjects
router.get('/', (req, res) => {
  try {
    const subjects = db.subjects.findAll({ userId: req.user._id })
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(subjects);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/subjects
router.post('/', async (req, res) => {
  try {
    const { name, difficulty = 'medium', color = '#6366f1', weeklyHoursTarget = 2, notes = '', icon = '📚' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Subject name is required' });
    const subject = db.subjects.create({ userId: req.user._id, name: name.trim(), difficulty, color, weeklyHoursTarget, notes, icon });
    await generateSchedule(req.user._id);
    res.status(201).json(subject);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/subjects/:id
router.put('/:id', async (req, res) => {
  try {
    const subject = db.subjects.findById(req.params.id);
    if (!subject || subject.userId !== req.user._id) return res.status(404).json({ error: 'Subject not found' });
    const updated = db.subjects.updateById(req.params.id, req.body);
    await generateSchedule(req.user._id);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/subjects/:id
router.delete('/:id', async (req, res) => {
  try {
    const subject = db.subjects.findById(req.params.id);
    if (!subject || subject.userId !== req.user._id) return res.status(404).json({ error: 'Subject not found' });
    db.subjects.deleteById(req.params.id);
    await generateSchedule(req.user._id);
    res.json({ message: 'Subject deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
