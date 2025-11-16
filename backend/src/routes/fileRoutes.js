const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const config = require('../config');
const { readDb, writeDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', '..', config.uploadDir);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuid()}${ext}`);
  }
});

const upload = multer({ storage });

router.use(authenticate);

router.get('/', (req, res) => {
  const data = readDb();
  res.json({ files: data.files || [] });
});

router.post('/upload', upload.array('files', 5), (req, res) => {
  const data = readDb();
  data.files = data.files || [];

  const savedFiles = req.files.map(file => {
    const meta = {
      id: uuid(),
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.username || '系统'
    };
    data.files.push(meta);
    return meta;
  });

  writeDb(data);
  res.status(201).json({ files: savedFiles });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const data = readDb();
  const file = (data.files || []).find(f => f.id === id);

  if (!file) {
    return res.status(404).json({ message: '文件不存在' });
  }

  const filePath = path.join(uploadDir, path.basename(file.filename));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  data.files = data.files.filter(f => f.id !== id);
  writeDb(data);

  res.json({ message: '已删除' });
});

module.exports = router;

