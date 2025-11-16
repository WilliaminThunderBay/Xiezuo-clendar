const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getData, saveData } = require('../db');
const { authenticate } = require('../middleware/auth');

// Get all comments for a task
router.get('/task/:taskId', authenticate, (req, res) => {
  try {
    const { taskId } = req.params;
    const data = getData();

    if (!data.comments) {
      data.comments = [];
      saveData(data);
    }

    const comments = data.comments
      .filter(c => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const commentsWithUsers = comments.map(comment => {
      const user = data.users.find(u => u.id === comment.userId);
      return {
        ...comment,
        username: user ? user.username : 'Unknown',
        userAvatar: user ? user.avatar : null
      };
    });

    res.json(commentsWithUsers);
  } catch (error) {
    console.error('Get comments failed:', error);
    res.status(500).json({ message: 'Failed to get comments' });
  }
});

// Add comment
router.post('/', authenticate, (req, res) => {
  try {
    const { taskId, content, parentId, mentions } = req.body;
    const userId = req.user.userId;
    const data = getData();

    if (!data.comments) data.comments = [];
    if (!data.activities) data.activities = [];
    if (!data.notifications) data.notifications = [];

    const task = data.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = {
      id: uuidv4(),
      taskId,
      userId,
      content,
      parentId: parentId || null,
      mentions: mentions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      likes: [],
      replies: []
    };

    data.comments.push(comment);

    const user = data.users.find(u => u.id === userId);
    const commentWithUser = {
      ...comment,
      username: user ? user.username : 'Unknown',
      userAvatar: user ? user.avatar : null
    };

    // Create activity record
    const activity = {
      id: uuidv4(),
      type: 'comment',
      userId,
      userName: user.username,
      taskId,
      taskTitle: task.title,
      description: `Commented on task: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      timestamp: new Date().toISOString()
    };
    data.activities.push(activity);

    // Create notifications for mentions
    if (mentions && mentions.length > 0) {
      mentions.forEach(mentionedUserId => {
        const mentionedUser = data.users.find(u => u.id === mentionedUserId);
        if (mentionedUser) {
          const notification = {
            id: uuidv4(),
            type: 'mention',
            userId: mentionedUserId,
            title: 'You were mentioned',
            message: `${user.username} mentioned you in task "${task.title}"`,
            taskId,
            link: `/frontend/installation_schedule.html?taskId=${taskId}`,
            read: false,
            createdAt: new Date().toISOString()
          };
          data.notifications.push(notification);
        }
      });
    }

    // Notify task owner
    if (task.staffId && task.staffId !== userId) {
      const notification = {
        id: uuidv4(),
        type: 'comment',
        userId: task.staffId,
        title: 'New comment on your task',
        message: `${user.username} commented on "${task.title}"`,
        taskId,
        link: `/frontend/installation_schedule.html?taskId=${taskId}`,
        read: false,
        createdAt: new Date().toISOString()
      };
      data.notifications.push(notification);
    }

    saveData(data);
    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Add comment failed:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Edit comment
router.put('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    const data = getData();

    const commentIndex = data.comments.findIndex(c => c.id === id);
    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = data.comments[commentIndex];
    if (comment.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.content = content;
    comment.updatedAt = new Date().toISOString();
    comment.isEdited = true;

    saveData(data);

    const user = data.users.find(u => u.id === userId);
    const commentWithUser = {
      ...comment,
      username: user ? user.username : 'Unknown',
      userAvatar: user ? user.avatar : null
    };

    res.json(commentWithUser);
  } catch (error) {
    console.error('Edit comment failed:', error);
    res.status(500).json({ message: 'Failed to edit comment' });
  }
});

// Delete comment
router.delete('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const data = getData();

    const commentIndex = data.comments.findIndex(c => c.id === id);
    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = data.comments[commentIndex];
    if (comment.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    data.comments = data.comments.filter(c => c.id !== id && c.parentId !== id);
    saveData(data);

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment failed:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

// Like/unlike comment
router.post('/:id/like', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const data = getData();

    const comment = data.comments.find(c => c.id === id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!comment.likes) comment.likes = [];

    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    saveData(data);
    res.json({ likes: comment.likes, likeCount: comment.likes.length });
  } catch (error) {
    console.error('Like comment failed:', error);
    res.status(500).json({ message: 'Failed to like comment' });
  }
});

// Get comment stats
router.get('/stats/:taskId', authenticate, (req, res) => {
  try {
    const { taskId } = req.params;
    const data = getData();

    if (!data.comments) data.comments = [];

    const taskComments = data.comments.filter(c => c.taskId === taskId);
    const commenters = new Set(taskComments.map(c => c.userId));
    const replyCount = taskComments.filter(c => c.parentId).length;
    
    const latestComment = taskComments.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    res.json({
      totalComments: taskComments.length,
      uniqueCommenters: commenters.size,
      replyCount,
      latestComment: latestComment ? {
        content: latestComment.content,
        createdAt: latestComment.createdAt,
        userId: latestComment.userId
      } : null
    });
  } catch (error) {
    console.error('Get stats failed:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

module.exports = router;
