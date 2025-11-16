const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getData, saveData } = require('../db');
const { authenticate } = require('../middleware/auth');

// Get task version history
router.get('/task/:taskId', authenticate, (req, res) => {
  try {
    const { taskId } = req.params;
    const data = getData();
    
    if (!data.taskVersions) data.taskVersions = [];

    const versions = data.taskVersions
      .filter(v => v.taskId === taskId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(version => {
        const user = data.users.find(u => u.id === version.userId);
        return {
          ...version,
          username: user ? user.username : 'Unknown'
        };
      });

    res.json(versions);
  } catch (error) {
    console.error('Get versions failed:', error);
    res.status(500).json({ message: 'Failed to get versions' });
  }
});

// Create version snapshot
router.post('/', authenticate, (req, res) => {
  try {
    const { taskId, taskData, changeDescription, isManual } = req.body;
    const userId = req.user.userId;
    const data = getData();

    if (!data.taskVersions) data.taskVersions = [];

    const version = {
      id: uuidv4(),
      taskId,
      userId,
      taskSnapshot: { ...taskData },
      changeDescription: changeDescription || 'Auto save',
      isManual: isManual || false,
      label: null,
      createdAt: new Date().toISOString()
    };

    data.taskVersions.push(version);
    saveData(data);

    res.status(201).json(version);
  } catch (error) {
    console.error('Create version failed:', error);
    res.status(500).json({ message: 'Failed to create version' });
  }
});

// Get version timeline
router.get('/timeline/:taskId', authenticate, (req, res) => {
  try {
    const { taskId } = req.params;
    const data = getData();

    if (!data.taskVersions) data.taskVersions = [];

    const versions = data.taskVersions
      .filter(v => v.taskId === taskId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const timeline = versions.map((version, index) => {
      const user = data.users.find(u => u.id === version.userId);
      return {
        id: version.id,
        createdAt: version.createdAt,
        username: user ? user.username : 'Unknown',
        description: version.changeDescription,
        label: version.label,
        isManual: version.isManual
      };
    });

    res.json(timeline);
  } catch (error) {
    console.error('Get timeline failed:', error);
    res.status(500).json({ message: 'Failed to get timeline' });
  }
});

module.exports = router;
