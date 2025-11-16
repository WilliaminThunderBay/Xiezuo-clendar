const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor() {
    this.io = null;
    this.onlineUsers = new Map(); // userId -> { socketId, username, currentTask, cursorPosition }
    this.taskEditSessions = new Map(); // taskId -> Set of userIds
  }

  initialize(httpServer) {
    this.io = require('socket.io')(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Socket.IO 认证中间件
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('认证失败：未提供token'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        next();
      } catch (error) {
        next(new Error('认证失败：token无效'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`用户连接: ${socket.username} (${socket.userId})`);
      
      // 用户上线
      this.handleUserOnline(socket);

      // 用户进入任务编辑
      socket.on('enter-task', (data) => this.handleEnterTask(socket, data));

      // 用户离开任务编辑
      socket.on('leave-task', (data) => this.handleLeaveTask(socket, data));

      // 光标位置更新
      socket.on('cursor-move', (data) => this.handleCursorMove(socket, data));

      // 任务内容实时更新
      socket.on('task-update', (data) => this.handleTaskUpdate(socket, data));

      // 评论相关
      socket.on('new-comment', (data) => this.handleNewComment(socket, data));

      // 聊天消息
      socket.on('chat-message', (data) => this.handleChatMessage(socket, data));

      // 用户断开连接
      socket.on('disconnect', () => this.handleUserOffline(socket));
    });

    console.log('WebSocket服务已初始化');
  }

  // 用户上线处理
  handleUserOnline(socket) {
    const userInfo = {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      currentTask: null,
      cursorPosition: null,
      connectedAt: new Date()
    };

    this.onlineUsers.set(socket.userId, userInfo);

    // 广播用户上线
    this.io.emit('user-online', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });

    // 发送当前在线用户列表给新用户
    socket.emit('online-users', this.getOnlineUsersList());
  }

  // 用户离线处理
  handleUserOffline(socket) {
    console.log(`用户断开: ${socket.username} (${socket.userId})`);
    
    const userInfo = this.onlineUsers.get(socket.userId);
    if (userInfo && userInfo.currentTask) {
      // 从任务编辑会话中移除
      const editors = this.taskEditSessions.get(userInfo.currentTask);
      if (editors) {
        editors.delete(socket.userId);
        if (editors.size === 0) {
          this.taskEditSessions.delete(userInfo.currentTask);
        }
      }
    }

    this.onlineUsers.delete(socket.userId);

    // 广播用户离线
    this.io.emit('user-offline', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });
  }

  // 进入任务编辑
  handleEnterTask(socket, data) {
    const { taskId } = data;
    const userInfo = this.onlineUsers.get(socket.userId);
    
    if (userInfo) {
      // 离开之前的任务
      if (userInfo.currentTask) {
        this.handleLeaveTask(socket, { taskId: userInfo.currentTask });
      }

      userInfo.currentTask = taskId;

      // 添加到任务编辑会话
      if (!this.taskEditSessions.has(taskId)) {
        this.taskEditSessions.set(taskId, new Set());
      }
      this.taskEditSessions.get(taskId).add(socket.userId);

      // 加入房间
      socket.join(`task-${taskId}`);

      // 通知其他用户
      socket.to(`task-${taskId}`).emit('user-enter-task', {
        userId: socket.userId,
        username: socket.username,
        taskId,
        timestamp: new Date()
      });

      // 发送当前编辑者列表
      socket.emit('task-editors', {
        taskId,
        editors: this.getTaskEditors(taskId)
      });
    }
  }

  // 离开任务编辑
  handleLeaveTask(socket, data) {
    const { taskId } = data;
    const userInfo = this.onlineUsers.get(socket.userId);

    if (userInfo && userInfo.currentTask === taskId) {
      userInfo.currentTask = null;
      userInfo.cursorPosition = null;

      // 从任务编辑会话中移除
      const editors = this.taskEditSessions.get(taskId);
      if (editors) {
        editors.delete(socket.userId);
        if (editors.size === 0) {
          this.taskEditSessions.delete(taskId);
        }
      }

      // 离开房间
      socket.leave(`task-${taskId}`);

      // 通知其他用户
      socket.to(`task-${taskId}`).emit('user-leave-task', {
        userId: socket.userId,
        username: socket.username,
        taskId,
        timestamp: new Date()
      });
    }
  }

  // 光标位置移动
  handleCursorMove(socket, data) {
    const { taskId, position, fieldName } = data;
    const userInfo = this.onlineUsers.get(socket.userId);

    if (userInfo) {
      userInfo.cursorPosition = { position, fieldName };

      // 广播给同一任务的其他编辑者
      socket.to(`task-${taskId}`).emit('cursor-update', {
        userId: socket.userId,
        username: socket.username,
        taskId,
        position,
        fieldName,
        timestamp: new Date()
      });
    }
  }

  // 任务更新
  handleTaskUpdate(socket, data) {
    const { taskId, field, value, oldValue } = data;

    // 广播给同一任务的其他编辑者
    socket.to(`task-${taskId}`).emit('task-changed', {
      userId: socket.userId,
      username: socket.username,
      taskId,
      field,
      value,
      oldValue,
      timestamp: new Date()
    });

    // 广播给所有用户（用于刷新列表）
    this.io.emit('task-updated', {
      taskId,
      updatedBy: socket.username,
      timestamp: new Date()
    });
  }

  // 新评论
  handleNewComment(socket, data) {
    const { taskId, comment } = data;

    // 广播给所有用户
    this.io.emit('new-comment-notification', {
      taskId,
      comment,
      author: socket.username,
      timestamp: new Date()
    });

    // 给任务编辑者发送实时通知
    socket.to(`task-${taskId}`).emit('comment-added', {
      taskId,
      comment,
      author: socket.username,
      authorId: socket.userId,
      timestamp: new Date()
    });
  }

  // 聊天消息
  handleChatMessage(socket, data) {
    const { message, mentions } = data;

    // 广播给所有在线用户
    this.io.emit('chat-message', {
      id: Date.now(),
      userId: socket.userId,
      username: socket.username,
      message,
      mentions,
      timestamp: new Date()
    });

    // 给被@的用户发送通知
    if (mentions && mentions.length > 0) {
      mentions.forEach(mentionedUserId => {
        const mentionedUser = this.onlineUsers.get(mentionedUserId);
        if (mentionedUser) {
          this.io.to(mentionedUser.socketId).emit('mention-notification', {
            from: socket.username,
            message,
            timestamp: new Date()
          });
        }
      });
    }
  }

  // 获取在线用户列表
  getOnlineUsersList() {
    return Array.from(this.onlineUsers.values()).map(user => ({
      userId: user.userId,
      username: user.username,
      currentTask: user.currentTask,
      connectedAt: user.connectedAt
    }));
  }

  // 获取任务编辑者列表
  getTaskEditors(taskId) {
    const editors = this.taskEditSessions.get(taskId);
    if (!editors) return [];

    return Array.from(editors).map(userId => {
      const user = this.onlineUsers.get(userId);
      return {
        userId: user.userId,
        username: user.username,
        cursorPosition: user.cursorPosition
      };
    });
  }

  // 主动推送通知给特定用户
  sendNotificationToUser(userId, notification) {
    const user = this.onlineUsers.get(userId);
    if (user) {
      this.io.to(user.socketId).emit('notification', notification);
    }
  }

  // 广播系统通知给所有用户
  broadcastSystemNotification(notification) {
    this.io.emit('system-notification', notification);
  }

  // 获取在线用户数量
  getOnlineUserCount() {
    return this.onlineUsers.size;
  }

  // 获取特定任务的编辑者数量
  getTaskEditorCount(taskId) {
    const editors = this.taskEditSessions.get(taskId);
    return editors ? editors.size : 0;
  }
}

// 单例模式
const websocketService = new WebSocketService();

module.exports = websocketService;
