const express = require('express');
const db = require('../config/database');
const { protect } = require('../middleware/auth');
const { generateSchedule } = require('../services/schedulingEngine');
const router = express.Router();

router.use(protect);

const populatePlan = (plan) => {
  const subject = plan.subjectId ? db.subjects.findById(plan.subjectId) : null;
  const deadline = plan.deadlineId ? db.deadlines.findById(plan.deadlineId) : null;
  return { ...plan, subject, deadline };
};

// GET /api/planner/schedule?date=YYYY-MM-DD  or  ?from=&to=
router.get('/schedule', (req, res) => {
  try {
    const { date, from, to } = req.query;
    let plans = db.studyPlans.findAll({ userId: req.user._id });

    if (date) plans = plans.filter(p => p.date === date);
    else if (from && to) plans = plans.filter(p => p.date >= from && p.date <= to);

    plans.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    res.json(plans.map(populatePlan));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/planner/regenerate
router.post('/regenerate', async (req, res) => {
  try {
    const result = await generateSchedule(req.user._id);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/planner/schedule/:id/complete
router.patch('/schedule/:id/complete', (req, res) => {
  try {
    const plan = db.studyPlans.findById(req.params.id);
    if (!plan || plan.userId !== req.user._id) return res.status(404).json({ error: 'Plan not found' });

    const updated = db.studyPlans.updateById(req.params.id, { status: 'completed' });

    // Log study session
    const today = new Date().toISOString().split('T')[0];
    const session = db.studySessions.create({
      userId: req.user._id,
      studyPlanId: plan._id,
      subjectId: plan.subjectId || null,
      date: plan.date,
      durationMinutes: plan.durationMinutes,
      pomodorosCompleted: req.body.pomodorosCompleted || 0,
      notes: req.body.notes || ''
    });

    // Update user streak + total hours
    const user = db.users.findById(req.user._id);
    const newTotal = (user.totalStudyHours || 0) + plan.durationMinutes / 60;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const newStreak = (user.lastStudyDate === yStr || user.lastStudyDate === today)
      ? (user.studyStreak || 0) + (user.lastStudyDate !== today ? 1 : 0)
      : 1;
    db.users.updateById(req.user._id, { totalStudyHours: newTotal, studyStreak: newStreak, lastStudyDate: today });

    res.json({ plan: populatePlan(updated), session });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/planner/schedule/:id/skip
router.patch('/schedule/:id/skip', (req, res) => {
  try {
    const plan = db.studyPlans.findById(req.params.id);
    if (!plan || plan.userId !== req.user._id) return res.status(404).json({ error: 'Plan not found' });
    const updated = db.studyPlans.updateById(req.params.id, { status: 'skipped' });
    res.json(populatePlan(updated));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/planner/session (manual pomodoro log)
router.post('/session', (req, res) => {
  try {
    const { subjectId, durationMinutes = 25, pomodorosCompleted = 1, notes = '' } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const session = db.studySessions.create({
      userId: req.user._id,
      subjectId: subjectId || null,
      date: today,
      durationMinutes: Number(durationMinutes),
      pomodorosCompleted: Number(pomodorosCompleted),
      notes
    });

    const user = db.users.findById(req.user._id);
    const newTotal = (user.totalStudyHours || 0) + Number(durationMinutes) / 60;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const newStreak = (user.lastStudyDate === yStr || user.lastStudyDate === today)
      ? (user.studyStreak || 0) + (user.lastStudyDate !== today ? 1 : 0)
      : 1;
    db.users.updateById(req.user._id, { totalStudyHours: newTotal, studyStreak: newStreak, lastStudyDate: today });

    res.status(201).json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/planner/sessions
router.get('/sessions', (req, res) => {
  try {
    const { from, to } = req.query;
    let sessions = db.studySessions.findAll({ userId: req.user._id });
    if (from && to) sessions = sessions.filter(s => s.date >= from && s.date <= to);
    sessions.sort((a, b) => b.date.localeCompare(a.date));
    res.json(sessions.map(s => ({
      ...s,
      subject: s.subjectId ? db.subjects.findById(s.subjectId) : null
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
