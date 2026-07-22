const express = require('express');
const db = require('../config/database');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/', (req, res) => {
  try {
    const notifications = db.notifications.findAll({ userId: req.user._id })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/read-all', (req, res) => {
  try {
    const notifs = db.notifications.findAll({ userId: req.user._id, read: false });
    notifs.forEach(n => db.notifications.updateById(n._id, { read: true }));
    res.json({ message: 'All marked as read' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/read', (req, res) => {
  try {
    const n = db.notifications.findById(req.params.id);
    if (!n || n.userId !== req.user._id) return res.status(404).json({ error: 'Not found' });
    db.notifications.updateById(req.params.id, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const n = db.notifications.findById(req.params.id);
    if (!n || n.userId !== req.user._id) return res.status(404).json({ error: 'Not found' });
    db.notifications.deleteById(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
