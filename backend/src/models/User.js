const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  settings: {
    pomodoroFocusMinutes: { type: Number, default: 25 },
    pomodoroShortBreak: { type: Number, default: 5 },
    pomodoroLongBreak: { type: Number, default: 15 },
    dailyStudyLimitHours: { type: Number, default: 6 },
    theme: { type: String, default: 'dark' },
    notificationsEnabled: { type: Boolean, default: true }
  },
  studyStreak: { type: Number, default: 0 },
  lastStudyDate: { type: Date, default: null },
  totalStudyHours: { type: Number, default: 0 },
  setupComplete: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
