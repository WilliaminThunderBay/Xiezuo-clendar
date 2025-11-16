const express = require('express');
const { readDb } = require('../db');
const { authenticate } = require('../middleware/auth');
const dayjs = require('dayjs');

const router = express.Router();
router.use(authenticate);

// 获取统计概览
router.get('/overview', (req, res) => {
  const data = readDb();
  const { startDate, endDate } = req.query;

  let tasks = data.tasks || [];
  
  // 日期筛选
  if (startDate) {
    tasks = tasks.filter(t => t.date >= startDate);
  }
  if (endDate) {
    tasks = tasks.filter(t => t.date <= endDate);
  }

  // 基础统计
  const totalTasks = tasks.length;
  const staffList = data.staff || [];
  const totalStaff = staffList.length;

  // 按状态统计
  const statusStats = {
    pending: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length
  };

  // 按服务类型统计
  const serviceStats = {};
  tasks.forEach(task => {
    const service = task.service || '未分类';
    serviceStats[service] = (serviceStats[service] || 0) + 1;
  });

  // 按颜色统计
  const colorStats = {};
  tasks.forEach(task => {
    const color = task.color || 'white';
    colorStats[color] = (colorStats[color] || 0) + 1;
  });

  // 按员工统计
  const staffStats = {};
  tasks.forEach(task => {
    const staff = task.staff || '未分配';
    staffStats[staff] = (staffStats[staff] || 0) + 1;
  });

  res.json({
    overview: {
      totalTasks,
      totalStaff,
      statusStats,
      completionRate: totalTasks > 0 ? Math.round((statusStats.completed / totalTasks) * 100) : 0
    },
    serviceStats,
    colorStats,
    staffStats,
    dateRange: { startDate, endDate }
  });
});

// 获取员工绩效报表
router.get('/staff-performance', (req, res) => {
  const data = readDb();
  const { startDate, endDate, staffId } = req.query;

  let tasks = data.tasks || [];
  
  // 日期筛选
  if (startDate) {
    tasks = tasks.filter(t => t.date >= startDate);
  }
  if (endDate) {
    tasks = tasks.filter(t => t.date <= endDate);
  }

  // 员工筛选
  if (staffId) {
    const staff = data.staff.find(s => s.id === staffId);
    if (staff) {
      tasks = tasks.filter(t => t.staff === staff.name);
    }
  }

  // 按员工分组统计
  const staffPerformance = {};
  
  tasks.forEach(task => {
    const staffName = task.staff || '未分配';
    if (!staffPerformance[staffName]) {
      staffPerformance[staffName] = {
        name: staffName,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        services: {},
        workDays: new Set()
      };
    }

    const stats = staffPerformance[staffName];
    stats.totalTasks++;
    
    if (task.completed) {
      stats.completedTasks++;
    } else {
      stats.pendingTasks++;
    }

    // 服务类型统计
    const service = task.service || '未分类';
    stats.services[service] = (stats.services[service] || 0) + 1;

    // 工作日统计
    if (task.date) {
      stats.workDays.add(task.date);
    }
  });

  // 转换为数组并计算完成率
  const performanceList = Object.values(staffPerformance).map(stats => ({
    ...stats,
    workDays: stats.workDays.size,
    completionRate: stats.totalTasks > 0 
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
      : 0,
    avgTasksPerDay: stats.workDays.size > 0 
      ? (stats.totalTasks / stats.workDays.size).toFixed(2) 
      : 0
  })).sort((a, b) => b.totalTasks - a.totalTasks);

  res.json({
    staffPerformance: performanceList,
    dateRange: { startDate, endDate }
  });
});

// 获取时间趋势报表
router.get('/time-trend', (req, res) => {
  const data = readDb();
  const { startDate, endDate, groupBy = 'day' } = req.query;

  let tasks = data.tasks || [];
  
  // 日期筛选
  if (startDate) {
    tasks = tasks.filter(t => t.date >= startDate);
  }
  if (endDate) {
    tasks = tasks.filter(t => t.date <= endDate);
  }

  // 按时间分组
  const timeTrend = {};
  
  tasks.forEach(task => {
    if (!task.date) return;

    let key;
    const date = dayjs(task.date);

    switch (groupBy) {
      case 'day':
        key = date.format('YYYY-MM-DD');
        break;
      case 'week':
        key = date.format('YYYY-[W]WW');
        break;
      case 'month':
        key = date.format('YYYY-MM');
        break;
      default:
        key = date.format('YYYY-MM-DD');
    }

    if (!timeTrend[key]) {
      timeTrend[key] = {
        date: key,
        total: 0,
        completed: 0,
        pending: 0,
        services: {}
      };
    }

    timeTrend[key].total++;
    if (task.completed) {
      timeTrend[key].completed++;
    } else {
      timeTrend[key].pending++;
    }

    const service = task.service || '未分类';
    timeTrend[key].services[service] = (timeTrend[key].services[service] || 0) + 1;
  });

  // 转换为数组并排序
  const trendList = Object.values(timeTrend).sort((a, b) => 
    a.date.localeCompare(b.date)
  );

  res.json({
    timeTrend: trendList,
    groupBy,
    dateRange: { startDate, endDate }
  });
});

// 获取服务类型分析
router.get('/service-analysis', (req, res) => {
  const data = readDb();
  const { startDate, endDate } = req.query;

  let tasks = data.tasks || [];
  
  // 日期筛选
  if (startDate) {
    tasks = tasks.filter(t => t.date >= startDate);
  }
  if (endDate) {
    tasks = tasks.filter(t => t.date <= endDate);
  }

  // 按服务类型统计
  const serviceAnalysis = {};
  
  tasks.forEach(task => {
    const service = task.service || '未分类';
    
    if (!serviceAnalysis[service]) {
      serviceAnalysis[service] = {
        name: service,
        total: 0,
        completed: 0,
        pending: 0,
        staff: {},
        locations: new Set()
      };
    }

    const stats = serviceAnalysis[service];
    stats.total++;
    
    if (task.completed) {
      stats.completed++;
    } else {
      stats.pending++;
    }

    // 员工统计
    const staffName = task.staff || '未分配';
    stats.staff[staffName] = (stats.staff[staffName] || 0) + 1;

    // 地点统计
    if (task.location) {
      stats.locations.add(task.location);
    }
  });

  // 转换为数组并计算完成率
  const analysisList = Object.values(serviceAnalysis).map(stats => ({
    name: stats.name,
    total: stats.total,
    completed: stats.completed,
    pending: stats.pending,
    completionRate: stats.total > 0 
      ? Math.round((stats.completed / stats.total) * 100) 
      : 0,
    locationCount: stats.locations.size,
    topStaff: Object.entries(stats.staff)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))
  })).sort((a, b) => b.total - a.total);

  res.json({
    serviceAnalysis: analysisList,
    dateRange: { startDate, endDate }
  });
});

// 获取地点热力图数据
router.get('/location-heatmap', (req, res) => {
  const data = readDb();
  const { startDate, endDate } = req.query;

  let tasks = data.tasks || [];
  
  // 日期筛选
  if (startDate) {
    tasks = tasks.filter(t => t.date >= startDate);
  }
  if (endDate) {
    tasks = tasks.filter(t => t.date <= endDate);
  }

  // 按地点统计
  const locationStats = {};
  
  tasks.forEach(task => {
    if (!task.location) return;

    const location = task.location;
    if (!locationStats[location]) {
      locationStats[location] = {
        location,
        count: 0,
        services: {},
        staff: {}
      };
    }

    locationStats[location].count++;
    
    const service = task.service || '未分类';
    locationStats[location].services[service] = 
      (locationStats[location].services[service] || 0) + 1;

    const staffName = task.staff || '未分配';
    locationStats[location].staff[staffName] = 
      (locationStats[location].staff[staffName] || 0) + 1;
  });

  // 转换为数组并排序
  const heatmapData = Object.values(locationStats)
    .sort((a, b) => b.count - a.count)
    .map(stats => ({
      location: stats.location,
      count: stats.count,
      topService: Object.entries(stats.services)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '未知',
      topStaff: Object.entries(stats.staff)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '未知'
    }));

  res.json({
    locationHeatmap: heatmapData,
    totalLocations: heatmapData.length,
    dateRange: { startDate, endDate }
  });
});

// 导出数据为 JSON
router.get('/export/json', (req, res) => {
  const data = readDb();
  const { type = 'all' } = req.query;

  let exportData = {};

  switch (type) {
    case 'tasks':
      exportData = { tasks: data.tasks };
      break;
    case 'staff':
      exportData = { staff: data.staff };
      break;
    case 'services':
      exportData = { services: data.services };
      break;
    case 'activity':
      exportData = { activity: data.activity };
      break;
    default:
      exportData = {
        tasks: data.tasks,
        staff: data.staff,
        services: data.services,
        activity: data.activity
      };
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=export-${type}-${Date.now()}.json`);
  res.json(exportData);
});

// 导出数据为 CSV
router.get('/export/csv', (req, res) => {
  const data = readDb();
  const { type = 'tasks' } = req.query;

  let csvContent = '';
  let filename = `export-${type}-${Date.now()}.csv`;

  if (type === 'tasks') {
    // CSV 表头
    csvContent = 'ID,工单号,车牌号,员工,日期,时间,地点,服务,备注,颜色,状态\n';
    
    // CSV 数据
    data.tasks.forEach(task => {
      csvContent += [
        task.id,
        task.number || '',
        task.plate || '',
        task.staff || '',
        task.date || '',
        task.time || '',
        task.location || '',
        task.service || '',
        (task.note || '').replace(/,/g, '，'), // 替换逗号避免CSV格式错误
        task.color || '',
        task.completed ? '已完成' : '进行中'
      ].join(',') + '\n';
    });
  } else if (type === 'staff') {
    csvContent = 'ID,姓名,角色,颜色,电话\n';
    
    data.staff.forEach(staff => {
      csvContent += [
        staff.id,
        staff.name || '',
        staff.role || '',
        staff.color || '',
        staff.phone || ''
      ].join(',') + '\n';
    });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send('\uFEFF' + csvContent); // 添加 BOM 以支持 Excel 打开中文
});

module.exports = router;
