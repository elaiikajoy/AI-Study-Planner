const mongoose = require('mongoose');

const deadlineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['assignment', 'project', 'quiz', 'exam', 'lab', 'other'], default: 'assignment' },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  estimatedHours: { type: Number, default: 2 },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'overdue'], default: 'pending' },
  notes: { type: String, default: '' },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Deadline', deadlineSchema);
