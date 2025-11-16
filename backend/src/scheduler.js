const cron = require('node-cron');
const dayjs = require('dayjs');
const { readDb, writeDb } = require('./db');

// 检查工单提醒
function checkTaskReminders() {
  const data = readDb();
  
  if (!data.tasks || data.tasks.length === 0) {
    return;
  }

  if (!data.notifications) {
    data.notifications = [];
  }

  const now = dayjs();
  
  data.tasks.forEach(task => {
    // 只检查未完成的工单
    if (task.status === '已完成' || task.status === '已取消') {
      return;
    }

    const taskDateTime = dayjs(`${task.date} ${task.time}`);
    const hoursUntil = taskDateTime.diff(now, 'hour', true);

    // 检查是否已经发送过相同类型的提醒
    const recentNotification = data.notifications.find(n => 
      n.taskId === task.id && 
      dayjs(n.createdAt).isAfter(now.subtract(1, 'hour'))
    );

    if (recentNotification) {
      return; // 1小时内已发送过提醒
    }

    let shouldNotify = false;
    let message = '';
    let type = 'info';

    // 逾期提醒
    if (hoursUntil < -1) {
      shouldNotify = true;
      message = `工单 ${task.number} 已逾期 ${Math.abs(Math.floor(hoursUntil))} 小时 - 地点：${task.location}`;
      type = 'error';
    }
    // 即将开始（2小时内）
    else if (hoursUntil > 0 && hoursUntil <= 2) {
      shouldNotify = true;
      message = `工单 ${task.number} 即将开始（还有 ${Math.floor(hoursUntil * 60)} 分钟） - 地点：${task.location}`;
      type = 'warning';
    }
    // 今天的工单（提前1天提醒）
    else if (hoursUntil > 2 && hoursUntil <= 24) {
      shouldNotify = true;
      message = `工单 ${task.number} 将于今天 ${task.time} 开始 - 地点：${task.location}`;
      type = 'info';
    }

    if (shouldNotify) {
      // 查找负责该工单的员工用户
      const user = data.users ? data.users.find(u => u.username === task.staff) : null;
      const targetUserId = user ? user.id : 'all';

      const notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: '工单提醒',
        message,
        type,
        userId: targetUserId,
        taskId: task.id,
        link: `/installation_schedule.html?taskId=${task.id}`,
        read: false,
        createdAt: new Date().toISOString()
      };

      data.notifications.push(notification);
      console.log(`[${now.format('YYYY-MM-DD HH:mm:ss')}] 创建通知: ${message}`);
    }
  });

  // 保留最近1000条通知
  if (data.notifications.length > 1000) {
    data.notifications = data.notifications.slice(-1000);
  }

  writeDb(data);
}

// 检查员工工作量提醒
function checkStaffWorkloadReminders() {
  const data = readDb();
  
  if (!data.tasks || !data.staff) {
    return;
  }

  if (!data.notifications) {
    data.notifications = [];
  }

  const now = dayjs();
  const today = now.format('YYYY-MM-DD');
  
  // 统计今天每个员工的工单数量
  const staffWorkload = {};
  
  data.tasks.forEach(task => {
    if (task.date === today && task.status !== '已取消') {
      if (!staffWorkload[task.staff]) {
        staffWorkload[task.staff] = {
          total: 0,
          completed: 0,
          pending: 0
        };
      }
      staffWorkload[task.staff].total++;
      if (task.status === '已完成') {
        staffWorkload[task.staff].completed++;
      } else {
        staffWorkload[task.staff].pending++;
      }
    }
  });

  // 工作量过大提醒（超过5个未完成工单）
  Object.entries(staffWorkload).forEach(([staffName, workload]) => {
    if (workload.pending > 5) {
      const user = data.users ? data.users.find(u => u.username === staffName) : null;
      const targetUserId = user ? user.id : 'all';

      // 检查今天是否已发送过工作量提醒
      const existingNotification = data.notifications.find(n => 
        n.userId === targetUserId &&
        n.title === '工作量提醒' &&
        dayjs(n.createdAt).format('YYYY-MM-DD') === today
      );

      if (!existingNotification) {
        const notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: '工作量提醒',
          message: `${staffName} 今天有 ${workload.pending} 个待完成工单，工作量较大，请注意合理安排`,
          type: 'warning',
          userId: 'all', // 发给所有管理员
          read: false,
          createdAt: new Date().toISOString()
        };

        data.notifications.push(notification);
        console.log(`[${now.format('YYYY-MM-DD HH:mm:ss')}] 工作量提醒: ${notification.message}`);
      }
    }
  });

  writeDb(data);
}

// 启动定时任务
function startScheduler() {
  console.log('通知调度器已启动');

  // 每30分钟检查一次工单提醒
  cron.schedule('*/30 * * * *', () => {
    console.log('执行工单提醒检查...');
    checkTaskReminders();
  });

  // 每天早上8点检查员工工作量
  cron.schedule('0 8 * * *', () => {
    console.log('执行工作量检查...');
    checkStaffWorkloadReminders();
  });

  // 启动时立即执行一次
  checkTaskReminders();
}

module.exports = { startScheduler, checkTaskReminders, checkStaffWorkloadReminders };
