const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  difficulty: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  color: { type: String, default: '#6366f1' },
  weeklyHoursTarget: { type: Number, default: 2 },
  notes: { type: String, default: '' },
  icon: { type: String, default: '📚' }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
