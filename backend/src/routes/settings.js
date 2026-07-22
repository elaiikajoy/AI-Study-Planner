const express = require('express');
const db = require('../config/database');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/', (req, res) => {
  try {
    const user = db.users.findById(req.user._id);
    res.json(user?.settings || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/', (req, res) => {
  try {
    const user = db.users.findById(req.user._id);
    const newSettings = { ...(user.settings || {}), ...req.body };
    db.users.updateById(req.user._id, { settings: newSettings });
    res.json(newSettings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
