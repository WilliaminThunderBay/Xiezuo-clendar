/**
 * WebSocket 客户端管理器
 * 处理实时协作功能
 */
class CollaborationClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.eventHandlers = {};
    this.currentTaskId = null;
  }

  /**
   * 连接到 WebSocket 服务器
   */
  connect(token) {
    if (this.socket && this.connected) {
      console.log('WebSocket 已连接');
      return;
    }

    // 加载 Socket.IO 客户端
    if (typeof io === 'undefined') {
      console.error('Socket.IO 客户端库未加载');
      return;
    }

    this.socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // 连接成功
    this.socket.on('connect', () => {
      console.log('WebSocket 已连接');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket 断开连接:', reason);
      this.connected = false;
      this.emit('disconnected', reason);

      // 自动重连
      if (reason === 'io server disconnect') {
        // 服务器主动断开，尝试重连
        this.reconnect(token);
      }
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket 连接错误:', error);
      this.emit('error', error);
      this.reconnect(token);
    });

    // 注册事件监听器
    this.registerSocketEvents();
  }

  /**
   * 重连
   */
  reconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数');
      this.emit('max-reconnect-attempts');
      return;
    }

    this.reconnectAttempts++;
    console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect(token);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * 注册 Socket 事件监听器
   */
  registerSocketEvents() {
    // 用户上线/离线
    this.socket.on('user-online', (data) => this.emit('user-online', data));
    this.socket.on('user-offline', (data) => this.emit('user-offline', data));
    this.socket.on('online-users', (data) => this.emit('online-users', data));

    // 任务编辑
    this.socket.on('user-enter-task', (data) => this.emit('user-enter-task', data));
    this.socket.on('user-leave-task', (data) => this.emit('user-leave-task', data));
    this.socket.on('task-editors', (data) => this.emit('task-editors', data));
    this.socket.on('cursor-update', (data) => this.emit('cursor-update', data));
    this.socket.on('task-changed', (data) => this.emit('task-changed', data));
    this.socket.on('task-updated', (data) => this.emit('task-updated', data));

    // 评论
    this.socket.on('new-comment-notification', (data) => this.emit('new-comment', data));
    this.socket.on('comment-added', (data) => this.emit('comment-added', data));

    // 聊天
    this.socket.on('chat-message', (data) => this.emit('chat-message', data));
    this.socket.on('mention-notification', (data) => this.emit('mention', data));

    // 通知
    this.socket.on('notification', (data) => this.emit('notification', data));
    this.socket.on('system-notification', (data) => this.emit('system-notification', data));
  }

  /**
   * 进入任务编辑
   */
  enterTask(taskId) {
    if (!this.connected || !this.socket) return;
    
    this.currentTaskId = taskId;
    this.socket.emit('enter-task', { taskId });
  }

  /**
   * 离开任务编辑
   */
  leaveTask(taskId) {
    if (!this.connected || !this.socket) return;
    
    this.socket.emit('leave-task', { taskId });
    if (this.currentTaskId === taskId) {
      this.currentTaskId = null;
    }
  }

  /**
   * 发送光标位置
   */
  sendCursorPosition(taskId, position, fieldName) {
    if (!this.connected || !this.socket) return;
    
    this.socket.emit('cursor-move', { taskId, position, fieldName });
  }

  /**
   * 发送任务更新
   */
  sendTaskUpdate(taskId, field, value, oldValue) {
    if (!this.connected || !this.socket) return;
    
    this.socket.emit('task-update', { taskId, field, value, oldValue });
  }

  /**
   * 发送评论通知
   */
  sendComment(taskId, comment) {
    if (!this.connected || !this.socket) return;
    
    this.socket.emit('new-comment', { taskId, comment });
  }

  /**
   * 发送聊天消息
   */
  sendChatMessage(message, mentions = []) {
    if (!this.connected || !this.socket) return;
    
    this.socket.emit('chat-message', { message, mentions });
  }

  /**
   * 注册事件处理器
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  /**
   * 移除事件处理器
   */
  off(event, handler) {
    if (!this.eventHandlers[event]) return;
    
    if (handler) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    } else {
      delete this.eventHandlers[event];
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (!this.eventHandlers[event]) return;
    
    this.eventHandlers[event].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`事件处理器错误 [${event}]:`, error);
      }
    });
  }

  /**
   * 获取连接状态
   */
  isConnected() {
    return this.connected;
  }

  /**
   * 获取当前编辑的任务
   */
  getCurrentTask() {
    return this.currentTaskId;
  }
}

// 创建全局单例
window.collaborationClient = new CollaborationClient();

// 辅助函数：从用户名提取@mentions
function extractMentions(text, allUsers) {
  const mentions = [];
  const mentionRegex = /@(\S+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const user = allUsers.find(u => u.username === username);
    if (user) {
      mentions.push(user.id);
    }
  }

  return mentions;
}

// 辅助函数：高亮显示@mentions
function highlightMentions(text) {
  return text.replace(/@(\S+)/g, '<span class="mention">@$1</span>');
}

// 导出
window.extractMentions = extractMentions;
window.highlightMentions = highlightMentions;
