const express = require('express');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const data = readDb();
  res.json({ activity: data.activity || [] });
});

router.post('/', (req, res) => {
  const { action, task } = req.body;
  if (!action || !task) {
    return res.status(400).json({ message: '请输入操作与工单编号' });
  }

  const data = readDb();
  const record = {
    id: uuid(),
    user: req.user?.username || '系统',
    action,
    task,
    timeAgo: '刚刚',
    timestamp: new Date().toISOString()
  };

  data.activity.unshift(record);
  if (data.activity.length > 50) {
    data.activity = data.activity.slice(0, 50);
  }
  writeDb(data);

  res.status(201).json({ record });
});

module.exports = router;

