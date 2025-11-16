const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

const defaultTasks = [
  {
    id: 1,
    number: 'W001',
    plate: '沪A·88888',
    staff: '李明',
    date: '2024-10-20',
    time: '19:00-22:00',
    location: '浦东陆家嘴',
    note: '客户要求晚上完成',
    color: 'red',
    type: '常规订单',
    service: '安装',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    number: 'G001',
    plate: '沪B·12345',
    staff: '李明',
    date: '2024-10-20',
    time: '20:00-23:00',
    location: '浦西外滩',
    note: '加班工单',
    color: 'red',
    type: '工程单',
    service: '安装',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    number: 'W002',
    plate: '沪A·99999',
    staff: '张三',
    date: '2024-10-21',
    time: '08:00-11:00',
    location: '浦东世纪大道',
    note: '',
    color: 'blue',
    type: '常规订单',
    service: '量尺',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    number: 'G002',
    plate: '沪B·54321',
    staff: '王五',
    date: '2024-10-21',
    time: '14:00-17:00',
    location: '虹口北外滩',
    note: '工程收尾',
    color: 'orange',
    type: '工程单',
    service: '安装',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 5,
    number: 'W003',
    plate: '沪A·11111',
    staff: '赵六',
    date: '2024-10-22',
    time: '09:00-12:00',
    location: '浦东张江',
    note: '',
    color: 'white',
    type: '常规订单',
    service: '安装',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 6,
    number: 'W004',
    plate: '沪A·77777',
    staff: '李明',
    date: '2024-10-25',
    time: '15:00-18:00',
    location: '长宁虹桥',
    note: '',
    color: 'green',
    type: '常规订单',
    service: '量尺',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 7,
    number: 'W005',
    plate: '沪B·66666',
    staff: '张三',
    date: '2024-10-25',
    time: '19:00-22:00',
    location: '闵行莘庄',
    note: '',
    color: 'blue',
    type: '常规订单',
    service: '安装',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 8,
    number: 'G003',
    plate: '沪A·33333',
    staff: '王五',
    date: '2024-10-26',
    time: '10:00-13:00',
    location: '松江泗泾',
    note: '工程巡检',
    color: 'orange',
    type: '工程单',
    service: '安装',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const defaultStaff = [
  { id: 'staff-1', name: '李明', role: '高级安装', color: '#667eea', phone: '13800000001' },
  { id: 'staff-2', name: '张三', role: '安装技师', color: '#4ecdc4', phone: '13800000002' },
  { id: 'staff-3', name: '王五', role: '工程负责人', color: '#ff6b6b', phone: '13800000003' },
  { id: 'staff-4', name: '赵六', role: '售后专家', color: '#f39c12', phone: '13800000004' }
];

const defaultServices = [
  { id: 'svc-1', name: '量尺', description: '上门量尺与方案确认' },
  { id: 'svc-2', name: '安装', description: '标准安装服务' },
  { id: 'svc-3', name: '维修', description: '售后维修支持' },
  { id: 'svc-4', name: '售后', description: '售后回访与维护' }
];

const defaultActivity = [
  { id: uuid(), user: '李明', action: '编辑', task: 'W001', timeAgo: '2分钟前', timestamp: new Date().toISOString() },
  { id: uuid(), user: '张三', action: '创建', task: 'W005', timeAgo: '5分钟前', timestamp: new Date().toISOString() },
  { id: uuid(), user: '王五', action: '完成', task: 'G002', timeAgo: '15分钟前', timestamp: new Date().toISOString() },
  { id: uuid(), user: '赵六', action: '删除', task: 'W002', timeAgo: '20分钟前', timestamp: new Date().toISOString() }
];

const defaultOnlineUsers = [
  { id: 1, name: '我', initials: 'ME', status: '在线', isEditing: false, editingTask: null, color: '#667eea' },
  { id: 2, name: '李明', initials: 'LM', status: '在线', isEditing: true, editingTask: 'W001', color: '#ff6b6b' },
  { id: 3, name: '张三', initials: 'ZS', status: '在线', isEditing: false, editingTask: null, color: '#4ecdc4' },
  { id: 4, name: '王五', initials: 'WW', status: '在线', isEditing: false, editingTask: null, color: '#f39c12' },
  { id: 5, name: '赵六', initials: 'ZL', status: '离线', isEditing: false, editingTask: null, color: '#9b59b6' }
];

const defaultData = {
  users: [],
  tasks: defaultTasks,
  staff: defaultStaff,
  services: defaultServices,
  activity: defaultActivity,
  onlineUsers: defaultOnlineUsers,
  files: [],
  whatsappOtps: [],
  notifications: [],
  comments: [],
  taskVersions: [],
  chatMessages: [],
  activities: []
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
  }

  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('数据库文件损坏，重新初始化。', err);
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
    return { ...defaultData };
  }
}

function writeDb(data) {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function initDb() {
  const data = readDb();
  if (!data.users || data.users.length === 0) {
    const passwordHash = bcrypt.hashSync('12345', 10);
    data.users = [
      {
        id: uuid(),
        username: 'admin',
        whatsapp: '+86 13800138000',
        email: 'admin@system.local',
        passwordHash,
        role: 'admin',
        avatar: '',
        createdAt: new Date().toISOString()
      }
    ];

    writeDb(data);
  }
}

module.exports = {
  readDb,
  writeDb,
  initDb,
  DB_PATH,
  getData: readDb,
  saveData: writeDb
};

