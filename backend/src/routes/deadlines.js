const express = require('express');
const db = require('../config/database');
const { protect } = require('../middleware/auth');
const { generateSchedule } = require('../services/schedulingEngine');
const router = express.Router();

router.use(protect);

// Helper: attach subject info to a deadline
const populateDeadline = (dl) => {
  const subject = dl.subjectId ? db.subjects.findById(dl.subjectId) : null;
  return { ...dl, subject: subject || null };
};

router.get('/', (req, res) => {
  try {
    const { status, upcoming } = req.query;
    let deadlines = db.deadlines.findAll({ userId: req.user._id });

    if (upcoming === 'true') {
      const now = new Date().toISOString();
      deadlines = deadlines.filter(d =>
        d.status !== 'completed' && d.dueDate >= now.split('T')[0]
      );
    } else if (status) {
      deadlines = deadlines.filter(d => d.status === status);
    }

    deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    res.json(deadlines.map(populateDeadline));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { subjectId, title, type = 'assignment', dueDate, priority = 'medium', estimatedHours = 2, notes = '' } = req.body;
    if (!subjectId || !title?.trim() || !dueDate) return res.status(400).json({ error: 'subjectId, title and dueDate are required' });
    const deadline = db.deadlines.create({
      userId: req.user._id, subjectId, title: title.trim(),
      type, dueDate, priority, estimatedHours: Number(estimatedHours),
      status: 'pending', notes, completedAt: null
    });
    await generateSchedule(req.user._id);
    res.status(201).json(populateDeadline(deadline));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const dl = db.deadlines.findById(req.params.id);
    if (!dl || dl.userId !== req.user._id) return res.status(404).json({ error: 'Deadline not found' });
    const updated = db.deadlines.updateById(req.params.id, req.body);
    await generateSchedule(req.user._id);
    res.json(populateDeadline(updated));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/complete', async (req, res) => {
  try {
    const dl = db.deadlines.findById(req.params.id);
    if (!dl || dl.userId !== req.user._id) return res.status(404).json({ error: 'Deadline not found' });
    const updated = db.deadlines.updateById(req.params.id, { status: 'completed', completedAt: new Date().toISOString() });
    await generateSchedule(req.user._id);
    res.json(populateDeadline(updated));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const dl = db.deadlines.findById(req.params.id);
    if (!dl || dl.userId !== req.user._id) return res.status(404).json({ error: 'Deadline not found' });
    db.deadlines.deleteById(req.params.id);
    await generateSchedule(req.user._id);
    res.json({ message: 'Deadline deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
