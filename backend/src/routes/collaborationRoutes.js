const express = require('express');
const router = express.Router();
const { getData } = require('../db');
const { authenticate } = require('../middleware/auth');
const dayjs = require('dayjs');

// Get collaboration overview
router.get('/overview', authenticate, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = getData();

    const start = startDate ? new Date(startDate) : dayjs().subtract(30, 'day').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    if (!data.activities) data.activities = [];
    if (!data.comments) data.comments = [];
    if (!data.taskVersions) data.taskVersions = [];

    const filteredActivities = data.activities.filter(a => {
      const activityDate = new Date(a.timestamp);
      return activityDate >= start && activityDate <= end;
    });

    const filteredComments = data.comments.filter(c => {
      const commentDate = new Date(c.createdAt);
      return commentDate >= start && commentDate <= end;
    });

    const tasksWithCollaboration = new Set(
      [...filteredComments.map(c => c.taskId), ...filteredActivities.map(a => a.taskId)]
    );

    const collaborationRate = data.tasks.length > 0 
      ? (tasksWithCollaboration.size / data.tasks.length * 100).toFixed(2) 
      : 0;

    const collaborators = new Set([
      ...filteredActivities.map(a => a.userId),
      ...filteredComments.map(c => c.userId)
    ]);

    const tasksWithComments = new Set(filteredComments.map(c => c.taskId));
    const commentUsageRate = data.tasks.length > 0
      ? (tasksWithComments.size / data.tasks.length * 100).toFixed(2)
      : 0;

    res.json({
      dateRange: { start, end },
      collaborationRate: parseFloat(collaborationRate),
      activeCollaborators: collaborators.size,
      totalActivities: filteredActivities.length,
      totalComments: filteredComments.length,
      commentUsageRate: parseFloat(commentUsageRate),
      tasksWithCollaboration: tasksWithCollaboration.size
    });
  } catch (error) {
    console.error('Get overview failed:', error);
    res.status(500).json({ message: 'Failed to get overview' });
  }
});

// Get feature adoption
router.get('/feature-adoption', authenticate, (req, res) => {
  try {
    const data = getData();

    const totalUsers = data.users.length;
    const totalTasks = data.tasks.length;

    if (!data.comments) data.comments = [];
    if (!data.chatMessages) data.chatMessages = [];

    const commentUsers = new Set(data.comments.map(c => c.userId));
    const chatUsers = new Set(data.chatMessages.map(m => m.userId));
    const tasksWithComments = new Set(data.comments.map(c => c.taskId));

    res.json({
      users: {
        total: totalUsers,
        commentUsers: commentUsers.size,
        commentAdoption: totalUsers > 0 ? (commentUsers.size / totalUsers * 100).toFixed(2) : 0,
        chatUsers: chatUsers.size,
        chatAdoption: totalUsers > 0 ? (chatUsers.size / totalUsers * 100).toFixed(2) : 0
      },
      tasks: {
        total: totalTasks,
        tasksWithComments: tasksWithComments.size,
        commentTaskAdoption: totalTasks > 0 ? (tasksWithComments.size / totalTasks * 100).toFixed(2) : 0
      },
      usage: {
        totalComments: data.comments.length,
        totalChatMessages: data.chatMessages.length,
        avgCommentsPerTask: totalTasks > 0 ? (data.comments.length / totalTasks).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get adoption failed:', error);
    res.status(500).json({ message: 'Failed to get adoption' });
  }
});

module.exports = router;
