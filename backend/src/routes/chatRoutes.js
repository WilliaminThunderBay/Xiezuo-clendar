const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getData, saveData } = require('../db');
const { authenticate } = require('../middleware/auth');

// Get chat messages
router.get('/', authenticate, (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const data = getData();

    if (!data.chatMessages) data.chatMessages = [];

    const messages = data.chatMessages
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map(msg => {
        const user = data.users.find(u => u.id === msg.userId);
        return {
          ...msg,
          username: user ? user.username : 'Unknown',
          userAvatar: user ? user.avatar : null
        };
      });

    res.json({
      messages,
      total: data.chatMessages.length,
      hasMore: (parseInt(offset) + parseInt(limit)) < data.chatMessages.length
    });
  } catch (error) {
    console.error('Get messages failed:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
});

// Send chat message
router.post('/', authenticate, (req, res) => {
  try {
    const { message, mentions, replyTo } = req.body;
    const userId = req.user.userId;
    const data = getData();

    if (!data.chatMessages) data.chatMessages = [];
    if (!data.notifications) data.notifications = [];

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const user = data.users.find(u => u.id === userId);
    
    const chatMessage = {
      id: uuidv4(),
      userId,
      message: message.trim(),
      mentions: mentions || [],
      replyTo: replyTo || null,
      createdAt: new Date().toISOString(),
      isEdited: false,
      reactions: {}
    };

    data.chatMessages.push(chatMessage);

    const messageWithUser = {
      ...chatMessage,
      username: user ? user.username : 'Unknown',
      userAvatar: user ? user.avatar : null
    };

    // Create notifications for mentions
    if (mentions && mentions.length > 0) {
      mentions.forEach(mentionedUserId => {
        const mentionedUser = data.users.find(u => u.id === mentionedUserId);
        if (mentionedUser) {
          const notification = {
            id: uuidv4(),
            type: 'mention',
            userId: mentionedUserId,
            title: 'You were mentioned in chat',
            message: `${user.username}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            link: '/frontend/collaboration.html#chat',
            read: false,
            createdAt: new Date().toISOString()
          };
          data.notifications.push(notification);
        }
      });
    }

    saveData(data);
    res.status(201).json(messageWithUser);
  } catch (error) {
    console.error('Send message failed:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get chat stats
router.get('/stats', authenticate, (req, res) => {
  try {
    const data = getData();

    if (!data.chatMessages) data.chatMessages = [];

    const totalMessages = data.chatMessages.length;
    const activeUsers = new Set(data.chatMessages.map(m => m.userId));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMessages = data.chatMessages.filter(m => 
      new Date(m.createdAt) >= today
    ).length;

    res.json({
      totalMessages,
      activeUserCount: activeUsers.size,
      todayMessages,
      mostActiveUser: null
    });
  } catch (error) {
    console.error('Get stats failed:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

module.exports = router;
