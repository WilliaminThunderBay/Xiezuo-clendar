const express = require('express');
const { readDb, writeDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const data = readDb();
  res.json({ users: data.onlineUsers || [] });
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { status, isEditing, editingTask } = req.body;

  const data = readDb();
  const user = data.onlineUsers.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ message: '在线用户不存在' });
  }

  if (typeof status !== 'undefined') user.status = status;
  if (typeof isEditing !== 'undefined') user.isEditing = isEditing;
  if (typeof editingTask !== 'undefined') user.editingTask = editingTask;

  writeDb(data);
  res.json({ user });
});

module.exports = router;

