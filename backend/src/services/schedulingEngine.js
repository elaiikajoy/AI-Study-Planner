/**
 * AI Scheduling Engine — pure JS, no database dependencies
 * Works entirely with the JSON file database.
 */
const db = require('../config/database');

const DAYS_AHEAD = 14;
const SESSION_BLOCK_MINUTES = 90;
const MIN_BLOCK_MINUTES = 30;
const DIFFICULTY_MULTIPLIER = { low: 1, medium: 1.5, high: 2.5 };

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
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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

    // Clear old auto-generated future scheduled plans
    const oldPlans = db.studyPlans.findAll({ userId, generatedBy: 'auto', status: 'scheduled' });
    oldPlans.filter(p => p.date >= todayStr).forEach(p => db.studyPlans.deleteById(p._id));

    // Get pending deadlines sorted by due date (most urgent first)
    const deadlines = db.deadlines.findAll({ userId })
      .filter(d => d.status !== 'completed' && d.dueDate >= todayStr)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

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
            notes: `Auto-scheduled for: ${deadline.title}`
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
