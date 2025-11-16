const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { initDb } = require('./db');
const { startScheduler } = require('./scheduler');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const staffRoutes = require('./routes/staffRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const activityRoutes = require('./routes/activityRoutes');
const aiRoutes = require('./routes/aiRoutes');
const wechatRoutes = require('./routes/wechatRoutes');
const fileRoutes = require('./routes/fileRoutes');
const onlineRoutes = require('./routes/onlineRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/commentRoutes');
const versionRoutes = require('./routes/versionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');

initDb();

const app = express();
const uploadPath = path.join(__dirname, '..', config.uploadDir);
const frontendPath = path.join(__dirname, '..', '..', 'frontend');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadPath));
app.use('/frontend', express.static(frontendPath)); // 服务前端静态文件

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径重定向到登录页
app.get('/', (req, res) => {
  res.redirect('/frontend/login.html');
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/wechat', wechatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/online-users', onlineRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/collaboration', collaborationRoutes);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).json({ message: err.message || '服务器错误' });
});

const http = require('http');
const websocketService = require('./websocket');

const server = http.createServer(app);

// 初始化 WebSocket
websocketService.initialize(server);

server.listen(config.port, () => {
  console.log(`Backend server running on http://localhost:${config.port}`);
  startScheduler(); // 启动通知调度器
});

