const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun, 6=Sat
  startTime: { type: String, required: true }, // "HH:mm" format
  endTime: { type: String, required: true },   // "HH:mm" format
  label: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Availability', availabilitySchema);
