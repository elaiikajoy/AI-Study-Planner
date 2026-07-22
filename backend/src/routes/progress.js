const express = require('express');
const db = require('../config/database');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/summary', (req, res) => {
  try {
    const userId = req.user._id;
    const user = db.users.findById(userId);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;

    const allSessions = db.studySessions.findAll({ userId });
    const todaySessions  = allSessions.filter(s => s.date === todayStr);
    const weekSessions   = allSessions.filter(s => s.date >= weekStartStr && s.date <= todayStr);
    const monthSessions  = allSessions.filter(s => s.date >= monthStartStr && s.date <= todayStr);

    const sumMins = (arr) => arr.reduce((a, s) => a + s.durationMinutes, 0);

    const allDeadlines = db.deadlines.findAll({ userId });
    const completed = allDeadlines.filter(d => d.status === 'completed').length;
    const overdue   = allDeadlines.filter(d => d.status !== 'completed' && d.dueDate < todayStr).length;

    res.json({
      streak: user?.studyStreak || 0,
      totalStudyHours: Math.round((user?.totalStudyHours || 0) * 10) / 10,
      today:  { minutes: sumMins(todaySessions),  sessions: todaySessions.length },
      week:   { minutes: sumMins(weekSessions),   sessions: weekSessions.length },
      month:  { minutes: sumMins(monthSessions),  sessions: monthSessions.length },
      deadlines: { completed, total: allDeadlines.length, overdue },
      completionRate: allDeadlines.length > 0 ? Math.round((completed / allDeadlines.length) * 100) : 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fromStr = from.toISOString().split('T')[0];

    const sessions = db.studySessions.findAll({ userId: req.user._id })
      .filter(s => s.date >= fromStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    const byDate = {};
    sessions.forEach(s => {
      if (!byDate[s.date]) byDate[s.date] = { date: s.date, totalMinutes: 0, sessions: 0, subjects: {} };
      byDate[s.date].totalMinutes += s.durationMinutes;
      byDate[s.date].sessions += 1;
      if (s.subjectId) {
        const sub = db.subjects.findById(s.subjectId);
        if (sub) byDate[s.date].subjects[sub.name] = (byDate[s.date].subjects[sub.name] || 0) + s.durationMinutes;
      }
    });

    res.json(Object.values(byDate));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
