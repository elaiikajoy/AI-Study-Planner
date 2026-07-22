const express = require('express');
const db = require('../config/database');
const { protect } = require('../middleware/auth');
const { generateSchedule } = require('../services/schedulingEngine');
const router = express.Router();

router.use(protect);

router.get('/', (req, res) => {
  try {
    const slots = db.availability.findAll({ userId: req.user._id })
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
    res.json(slots);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, label = '' } = req.body;
    if (dayOfWeek === undefined || !startTime || !endTime) return res.status(400).json({ error: 'dayOfWeek, startTime and endTime are required' });
    if (startTime >= endTime) return res.status(400).json({ error: 'End time must be after start time' });
    const slot = db.availability.create({ userId: req.user._id, dayOfWeek: Number(dayOfWeek), startTime, endTime, label });
    await generateSchedule(req.user._id);
    res.status(201).json(slot);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const slot = db.availability.findById(req.params.id);
    if (!slot || slot.userId !== req.user._id) return res.status(404).json({ error: 'Slot not found' });
    const updated = db.availability.updateById(req.params.id, req.body);
    await generateSchedule(req.user._id);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const slot = db.availability.findById(req.params.id);
    if (!slot || slot.userId !== req.user._id) return res.status(404).json({ error: 'Slot not found' });
    db.availability.deleteById(req.params.id);
    await generateSchedule(req.user._id);
    res.json({ message: 'Availability slot removed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/', async (req, res) => {
  try {
    db.availability.deleteMany({ userId: req.user._id });
    await generateSchedule(req.user._id);
    res.json({ message: 'All availability cleared' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
