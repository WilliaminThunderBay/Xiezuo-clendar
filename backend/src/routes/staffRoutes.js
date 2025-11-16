const express = require('express');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const data = readDb();
  res.json({ staff: data.staff || [] });
});

router.post('/', (req, res) => {
  const { name, role, color, phone } = req.body;
  if (!name) {
    return res.status(400).json({ message: '请输入员工姓名' });
  }

  const data = readDb();
  const staffExists = data.staff.some(s => s.name === name);
  if (staffExists) {
    return res.status(409).json({ message: '员工已存在' });
  }

  const newStaff = {
    id: uuid(),
    name,
    role: role || '安装技师',
    color: color || '#667eea',
    phone: phone || '',
    createdAt: new Date().toISOString()
  };

  data.staff.push(newStaff);
  writeDb(data);
  res.status(201).json({ staff: newStaff });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const data = readDb();
  const exists = data.staff.some(s => s.id === id);
  if (!exists) {
    return res.status(404).json({ message: '员工不存在' });
  }

  data.staff = data.staff.filter(s => s.id !== id);
  writeDb(data);
  res.json({ message: '已删除' });
});

module.exports = router;

