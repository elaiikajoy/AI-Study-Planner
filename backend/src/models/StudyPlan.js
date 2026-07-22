const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  deadline: { type: mongoose.Schema.Types.ObjectId, ref: 'Deadline', default: null },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  startTime: { type: String, required: true }, // "HH:mm"
  endTime: { type: String, required: true },   // "HH:mm"
  durationMinutes: { type: Number, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'skipped', 'in-progress'], default: 'scheduled' },
  notes: { type: String, default: '' },
  generatedBy: { type: String, enum: ['auto', 'manual'], default: 'auto' }
}, { timestamps: true });

const studySessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', default: null },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  durationMinutes: { type: Number, required: true },
  pomodorosCompleted: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, { timestamps: true });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
const StudySession = mongoose.model('StudySession', studySessionSchema);

module.exports = { StudyPlan, StudySession };
