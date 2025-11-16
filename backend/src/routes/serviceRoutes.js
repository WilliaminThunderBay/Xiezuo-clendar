const express = require('express');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const data = readDb();
  res.json({ services: data.services || [] });
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: '请输入服务名称' });
  }

  const data = readDb();
  const exists = data.services.some(s => s.name === name);
  if (exists) {
    return res.status(409).json({ message: '服务已存在' });
  }

  const newService = {
    id: uuid(),
    name,
    description: description || ''
  };

  data.services.push(newService);
  writeDb(data);

  res.status(201).json({ service: newService });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const data = readDb();
  const exists = data.services.some(s => s.id === id);
  if (!exists) {
    return res.status(404).json({ message: '服务不存在' });
  }

  data.services = data.services.filter(s => s.id !== id);
  writeDb(data);
  res.json({ message: '已删除' });
});

module.exports = router;

