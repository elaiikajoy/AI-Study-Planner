require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes         = require('./routes/auth');
const subjectRoutes      = require('./routes/subjects');
const availabilityRoutes = require('./routes/availability');
const deadlineRoutes     = require('./routes/deadlines');
const plannerRoutes      = require('./routes/planner');
const progressRoutes     = require('./routes/progress');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes     = require('./routes/settings');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',          authRoutes);
app.use('/api/subjects',      subjectRoutes);
app.use('/api/availability',  availabilityRoutes);
app.use('/api/deadlines',     deadlineRoutes);
app.use('/api/planner',       plannerRoutes);
app.use('/api/progress',      progressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings',      settingsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', db: 'JSON file', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 AI Study Planner API  →  http://localhost:${PORT}`);
  console.log(`📁 Database: JSON file (no MongoDB needed)\n`);
});

module.exports = app;
