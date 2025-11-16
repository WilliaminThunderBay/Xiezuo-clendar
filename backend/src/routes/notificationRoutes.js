const express = require('express');
const { readDb, writeDb } = require('../db');
const { authenticate } = require('../middleware/auth');
const dayjs = require('dayjs');

const router = express.Router();
router.use(authenticate);

// 获取用户的所有通知
router.get('/', (req, res) => {
  const data = readDb();
  const userId = req.user.id;
  
  // 初始化通知数组
  if (!data.notifications) {
    data.notifications = [];
  }

  // 筛选用户的通知
  const userNotifications = data.notifications
    .filter(n => n.userId === userId || n.userId === 'all')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ notifications: userNotifications });
});

// 创建新通知
router.post('/', (req, res) => {
  const { title, message, type = 'info', userId = 'all', taskId, link } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: '标题和内容不能为空' });
  }

  const data = readDb();
  if (!data.notifications) {
    data.notifications = [];
  }

  const notification = {
    id: `notif-${Date.now()}`,
    title,
    message,
    type, // info, success, warning, error
    userId, // 'all' 表示所有用户
    taskId,
    link,
    read: false,
    createdAt: new Date().toISOString()
  };

  data.notifications.push(notification);
  
  // 保留最近1000条通知
  if (data.notifications.length > 1000) {
    data.notifications = data.notifications.slice(-1000);
  }

  writeDb(data);
  res.status(201).json({ notification });
});

// 标记通知为已读
router.put('/:id/read', (req, res) => {
  const { id } = req.params;
  const data = readDb();

  if (!data.notifications) {
    return res.status(404).json({ message: '通知不存在' });
  }

  const notification = data.notifications.find(n => n.id === id);
  
  if (!notification) {
    return res.status(404).json({ message: '通知不存在' });
  }

  notification.read = true;
  writeDb(data);

  res.json({ notification });
});

// 标记所有通知为已读
router.put('/read-all', (req, res) => {
  const data = readDb();
  const userId = req.user.id;

  if (!data.notifications) {
    data.notifications = [];
  }

  data.notifications.forEach(notification => {
    if (notification.userId === userId || notification.userId === 'all') {
      notification.read = true;
    }
  });

  writeDb(data);
  res.json({ message: '所有通知已标记为已读' });
});

// 删除通知
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const data = readDb();

  if (!data.notifications) {
    return res.status(404).json({ message: '通知不存在' });
  }

  const initialLength = data.notifications.length;
  data.notifications = data.notifications.filter(n => n.id !== id);

  if (data.notifications.length === initialLength) {
    return res.status(404).json({ message: '通知不存在' });
  }

  writeDb(data);
  res.json({ message: '通知已删除' });
});

// 获取未读通知数量
router.get('/unread-count', (req, res) => {
  const data = readDb();
  const userId = req.user.id;

  if (!data.notifications) {
    return res.json({ count: 0 });
  }

  const unreadCount = data.notifications.filter(n => 
    !n.read && (n.userId === userId || n.userId === 'all')
  ).length;

  res.json({ count: unreadCount });
});

// 系统自动创建工单提醒
router.post('/task-reminder', authenticate, (req, res) => {
  const { taskId } = req.body;
  const data = readDb();

  const task = data.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ message: '工单不存在' });
  }

  // 检查工单日期
  const taskDate = dayjs(task.date);
  const now = dayjs();
  const hoursUntil = taskDate.diff(now, 'hour');

  let message = '';
  let type = 'info';

  if (hoursUntil < 0) {
    message = `工单 ${task.number} 已逾期 ${Math.abs(hoursUntil)} 小时`;
    type = 'error';
  } else if (hoursUntil < 2) {
    message = `工单 ${task.number} 即将开始（还有 ${hoursUntil} 小时）`;
    type = 'warning';
  } else if (hoursUntil < 24) {
    message = `工单 ${task.number} 将于今天 ${task.time} 开始`;
    type = 'info';
  } else {
    message = `工单 ${task.number} 将于 ${task.date} ${task.time} 开始`;
    type = 'info';
  }

  // 查找负责该工单的员工
  const staff = data.staff.find(s => s.name === task.staff);
  const user = data.users.find(u => u.username === task.staff);
  const targetUserId = user ? user.id : 'all';

  const notification = {
    id: `notif-${Date.now()}`,
    title: '工单提醒',
    message: `${message} - 地点：${task.location}`,
    type,
    userId: targetUserId,
    taskId: task.id,
    link: `/installation_schedule.html?taskId=${task.id}`,
    read: false,
    createdAt: new Date().toISOString()
  };

  if (!data.notifications) {
    data.notifications = [];
  }

  data.notifications.push(notification);
  writeDb(data);

  res.status(201).json({ notification });
});

module.exports = router;
