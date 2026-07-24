/**
 * AI Scheduling Engine — pure JS, no database dependencies
 * Works entirely with the JSON file database.
 */
const db = require('../config/database');

const DAYS_AHEAD = 14;
const SESSION_BLOCK_MINUTES = 90;
const MIN_BLOCK_MINUTES = 30;
const DIFFICULTY_MULTIPLIER = { low: 1, medium: 1.5, high: 2.5 };
const DIFFICULTY_SCORE = { low: 1, medium: 2, high: 3 };
const PRIORITY_BOOST = { critical: 3, high: 2, medium: 1, low: 0 };

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (total) => {
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
};

const dateToString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const daysUntil = (dateStr, fromDateStr) => {
  const due = new Date(dateStr);
  const from = new Date(fromDateStr);
  return Math.ceil((due.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
};

const getDeadlineScore = (deadline, subject, todayStr) => {
  const daysLeft = daysUntil(deadline.dueDate, todayStr);
  const urgency = daysLeft <= 1 ? 5 : daysLeft <= 3 ? 4 : daysLeft <= 7 ? 3 : daysLeft <= 14 ? 2 : 1;
  const difficulty = DIFFICULTY_SCORE[subject?.difficulty] || 2;
  const priority = PRIORITY_BOOST[deadline.priority] ?? 1;
  return urgency + difficulty + priority;
};

const getUpcomingDates = (daysAhead = DAYS_AHEAD) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: daysAhead }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { date: dateToString(d), dayOfWeek: d.getDay() };
  });
};

const generateSchedule = async (userId) => {
  try {
    const todayStr = dateToString(new Date());

    // Rebuild the auto-generated schedule from scratch so stale plans do not linger.
    const oldPlans = db.studyPlans.findAll({ userId, generatedBy: 'auto' });
    oldPlans.forEach(p => db.studyPlans.deleteById(p._id));

    // Get pending deadlines sorted by a transparent priority score.
    const deadlines = db.deadlines.findAll({ userId })
      .filter(d => d.status !== 'completed' && d.dueDate >= todayStr)
      .sort((a, b) => {
        const subjectA = db.subjects.findById(a.subjectId);
        const subjectB = db.subjects.findById(b.subjectId);
        const scoreA = getDeadlineScore(a, subjectA, todayStr);
        const scoreB = getDeadlineScore(b, subjectB, todayStr);
        if (scoreA !== scoreB) return scoreB - scoreA;
        const dueDiff = new Date(a.dueDate) - new Date(b.dueDate);
        if (dueDiff !== 0) return dueDiff;
        const priorityDiff = (PRIORITY_BOOST[b.priority] ?? 0) - (PRIORITY_BOOST[a.priority] ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        return (subjectB?.difficulty || '').localeCompare(subjectA?.difficulty || '');
      });

    if (deadlines.length === 0) return { plans: [], count: 0 };

    const availability = db.availability.findAll({ userId });
    if (availability.length === 0) return { plans: [], count: 0 };

    const user = db.users.findById(userId);
    const userDailyLimitMins = (user?.settings?.dailyStudyLimitHours || 6) * 60;

    // Build daily windows
    const upcomingDates = getUpcomingDates(DAYS_AHEAD);
    const dailyWindows = {};
    const dailyUsed = {};

    upcomingDates.forEach(({ date, dayOfWeek }) => {
      const slots = availability.filter(a => a.dayOfWeek === dayOfWeek);
      dailyWindows[date] = slots.map(s => ({
        start: timeToMinutes(s.startTime),
        end: timeToMinutes(s.endTime),
        cursor: timeToMinutes(s.startTime)
      }));
      dailyUsed[date] = 0;
    });

    // Account for existing manual plans
    const manualPlans = db.studyPlans.findAll({ userId, generatedBy: 'manual', status: 'scheduled' })
      .filter(p => p.date >= todayStr);

    manualPlans.forEach(p => {
      if (dailyUsed[p.date] !== undefined) {
        dailyUsed[p.date] += p.durationMinutes;
        const startM = timeToMinutes(p.startTime);
        const endM = timeToMinutes(p.endTime);
        if (dailyWindows[p.date]) {
          dailyWindows[p.date].forEach(w => {
            if (startM >= w.start && startM < w.end) {
              w.cursor = Math.max(w.cursor, endM);
            }
          });
        }
      }
    });

    const createdPlans = [];

    for (const deadline of deadlines) {
      const subject = db.subjects.findById(deadline.subjectId);
      if (!subject) continue;

      const multiplier = DIFFICULTY_MULTIPLIER[subject.difficulty] || 1.5;
      let minutesRemaining = Math.round((deadline.estimatedHours || 2) * multiplier * 60);
      const deadlineScore = getDeadlineScore(deadline, subject, todayStr);

      const availableDates = upcomingDates
        .filter(({ date }) => date <= deadline.dueDate)
        .map(({ date }) => date);

      for (const date of availableDates) {
        if (minutesRemaining <= 0) break;
        if (!dailyWindows[date]?.length) continue;
        if (dailyUsed[date] >= userDailyLimitMins) continue;

        for (const window of dailyWindows[date]) {
          if (minutesRemaining <= 0) break;
          const availableInWindow = window.end - window.cursor;
          if (availableInWindow < MIN_BLOCK_MINUTES) continue;

          const remainingCap = userDailyLimitMins - dailyUsed[date];
          const sessionDuration = Math.min(availableInWindow, remainingCap, SESSION_BLOCK_MINUTES, minutesRemaining);
          if (sessionDuration < MIN_BLOCK_MINUTES) continue;

          const plan = db.studyPlans.create({
            userId,
            subjectId: subject._id,
            deadlineId: deadline._id,
            date,
            startTime: minutesToTime(window.cursor),
            endTime: minutesToTime(window.cursor + sessionDuration),
            durationMinutes: sessionDuration,
            status: 'scheduled',
            generatedBy: 'auto',
            notes: `Auto-scheduled: ${subject.name} -> ${deadline.title} (due ${deadline.dueDate}) | score:${deadlineScore}`
          });

          createdPlans.push(plan);
          window.cursor += sessionDuration;
          dailyUsed[date] += sessionDuration;
          minutesRemaining -= sessionDuration;
        }
      }

      if (minutesRemaining > 30) {
        db.notifications.create({
          userId,
          type: 'deadline',
          title: `Limited time for "${deadline.title}"`,
          message: `Could not schedule all study sessions. Add more availability slots.`,
          priority: 'high',
          relatedId: deadline._id,
          read: false
        });
      }
    }

    return { plans: createdPlans, count: createdPlans.length };
  } catch (error) {
    console.error('Scheduling engine error:', error);
    throw error;
  }
};

module.exports = { generateSchedule };
