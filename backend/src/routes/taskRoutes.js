const express = require('express');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function appendActivity(data, user, action, task) {
  data.activity = data.activity || [];
  data.activity.unshift({
    id: uuid(),
    user,
    action,
    task,
    timeAgo: '刚刚',
    timestamp: new Date().toISOString()
  });

  if (data.activity.length > 50) {
    data.activity = data.activity.slice(0, 50);
  }
}

router.get('/', (req, res) => {
  const data = readDb();
  res.json({ tasks: data.tasks || [] });
});

router.post('/', (req, res) => {
  const { number, plate, staff, date, time, location, service, note, color, type } = req.body;

  if (!plate || !staff || !date || !time || !location || !service) {
    return res.status(400).json({ message: '请填写完整的工单信息' });
  }

  const data = readDb();
  const nextId = data.tasks.length > 0 ? Math.max(...data.tasks.map(t => t.id)) + 1 : 1;
  const taskNumber = number || `W${String(nextId).padStart(3, '0')}`;

  const newTask = {
    id: nextId,
    number: taskNumber,
    plate,
    staff,
    date,
    time,
    location,
    service,
    note: note || '',
    color: color || 'blue',
    type: type || (taskNumber.startsWith('G') ? '工程单' : '常规订单'),
    createdBy: req.user?.username || '系统',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.tasks.push(newTask);
  appendActivity(data, req.user?.username || '系统', '创建', taskNumber);
  writeDb(data);

  res.status(201).json({ task: newTask });
});

router.put('/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const data = readDb();
  const task = data.tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ message: '工单不存在' });
  }

  const updates = req.body || {};
  Object.assign(task, updates, { updatedAt: new Date().toISOString() });

  appendActivity(data, req.user?.username || '系统', '更新', task.number);
  writeDb(data);

  res.json({ task });
});

router.delete('/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const data = readDb();
  const task = data.tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ message: '工单不存在' });
  }

  data.tasks = data.tasks.filter(t => t.id !== taskId);
  appendActivity(data, req.user?.username || '系统', '删除', task.number);
  writeDb(data);

  res.json({ message: '已删除', taskId });
});

module.exports = router;

