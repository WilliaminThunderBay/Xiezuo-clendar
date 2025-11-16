# 工程安装月历管理系统

一个功能完整的工程安装调度和管理系统，包含日历视图、员工管理、任务调度、协作功能、AI助手、通知系统和数据报表等模块。

## 📁 项目结构

```
xiezuoCalendar/
├── frontend/                    # 前端文件
│   ├── installation_schedule.html    # 主日历系统（3200+行）
│   ├── login.html                    # 登录页面
│   ├── notification-center.html      # 通知中心
│   ├── reports.html                  # 数据报表
│   ├── ai_assistant.html             # AI助手（原版）
│   ├── ai_assistant_v4.html          # AI助手 v4
│   ├── ai_assistant_float.html       # AI助手悬浮窗版
│   ├── ai_diagnostic.html            # AI诊断工具
│   ├── wechat_callback.html          # 微信回调页面
│   └── app-config.js                 # 前端配置文件
│
├── backend/                     # 后端服务
│   ├── src/
│   │   ├── index.js                  # 主入口文件
│   │   ├── config.js                 # 配置文件
│   │   ├── db.js                     # 数据库操作
│   │   ├── scheduler.js              # 定时任务调度器
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT认证中间件
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # 用户认证路由
│   │   │   ├── taskRoutes.js         # 工单管理路由
│   │   │   ├── staffRoutes.js        # 员工管理路由
│   │   │   ├── serviceRoutes.js      # 服务类型路由
│   │   │   ├── activityRoutes.js     # 活动日志路由
│   │   │   ├── aiRoutes.js           # AI助手路由
│   │   │   ├── wechatRoutes.js       # 微信集成路由
│   │   │   ├── fileRoutes.js         # 文件上传路由
│   │   │   ├── onlineRoutes.js       # 在线用户路由
│   │   │   ├── reportRoutes.js       # 报表统计路由
│   │   │   └── notificationRoutes.js # 通知系统路由
│   │   └── utils/
│   ├── data/
│   │   └── db.json                   # JSON数据库文件
│   ├── uploads/                      # 文件上传目录
│   ├── package.json
│   └── .env                          # 环境变量配置
│
└── docs/                        # 项目文档
    ├── 系统完整性评估报告.md
    └── 通知系统使用说明.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

创建 `backend/.env` 文件：

```env
PORT=3000
JWT_SECRET=your-secret-key-here
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### 3. 启动后端服务

```bash
cd backend
npm start
```

服务将在 `http://localhost:3000` 启动

### 4. 访问前端页面

在浏览器中打开：
- 登录页面: `frontend/login.html`
- 主系统: `frontend/installation_schedule.html`
- 通知中心: `frontend/notification-center.html`
- 数据报表: `frontend/reports.html`

## ✨ 核心功能

### 1. 日历管理系统
- 📅 **多视图模式**: 日视图、周视图、月视图
- 📝 **工单管理**: 创建、编辑、删除、拖拽移动
- 🎨 **颜色标记**: 12种颜色区分工单类型
- 🔍 **筛选功能**: 按员工、服务类型、状态筛选
- 📊 **统计面板**: 实时显示工单统计数据

### 2. 员工管理
- 👥 **员工信息**: 姓名、联系方式、技能标签
- 📈 **工作量统计**: 完成率、工作天数、平均任务数
- 🎯 **任务分配**: 智能分配工单给员工
- 📞 **快速联系**: 一键拨号功能

### 3. 协作功能
- 👀 **在线用户**: 实时显示在线成员
- 💬 **活动日志**: 记录所有操作历史
- 🔄 **实时同步**: 30秒自动刷新数据
- 👤 **用户头像**: 彩色头像显示编辑状态

### 4. 通知系统
- 🔔 **自动提醒**: 工单逾期、即将开始自动通知
- ⚠️ **工作量预警**: 员工任务过多自动提醒
- 📨 **通知中心**: 统一管理所有通知
- 🎯 **智能筛选**: 按类型、已读状态筛选

### 5. AI助手
- 🤖 **智能对话**: 集成DeepSeek API
- 📁 **文件上传**: 支持图片、文档上传分析
- 💾 **对话管理**: 保存、重命名、删除对话
- 📂 **项目组织**: ChatGPT风格的项目管理

### 6. 数据报表
- 📊 **统计概览**: 总任务、完成率、员工数等
- 📈 **趋势分析**: 时间趋势图表（日/周/月）
- 🥧 **服务分析**: 服务类型分布饼图
- 🗺️ **位置热力**: 地点工作量热力图
- 💾 **数据导出**: JSON、CSV格式导出

### 7. 用户认证
- 🔐 **JWT认证**: 安全的用户认证
- 👤 **用户管理**: 注册、登录、退出
- 🔑 **密码加密**: bcrypt加密存储
- 🎫 **Token刷新**: 自动续期机制

### 8. 微信集成
- 📱 **微信登录**: OAuth 2.0授权登录
- 🔗 **账号绑定**: 微信与系统账号关联
- 📲 **扫码登录**: 快速登录方式

## 🛠️ 技术栈

### 前端
- **框架**: 原生 JavaScript (Vanilla JS)
- **图表**: Chart.js 4.4.0
- **样式**: CSS3 (Grid + Flexbox)
- **存储**: LocalStorage

### 后端
- **框架**: Express.js 5.1.0
- **认证**: JWT (jsonwebtoken 9.0.2)
- **加密**: bcryptjs 3.0.3
- **上传**: Multer 2.0.2
- **调度**: node-cron
- **日期**: dayjs 1.11.19
- **数据库**: JSON文件存储

## 📊 系统完整度

当前完整度: **76%**

✅ **已完成模块** (9个):
1. ✅ 用户认证与授权
2. ✅ 工单管理 (CRUD)
3. ✅ 日历视图 (日/周/月)
4. ✅ 员工管理
5. ✅ 服务类型管理
6. ✅ 协作功能
7. ✅ AI助手集成
8. ✅ 文件管理
9. ✅ 数据持久化
10. ✅ 报表系统
11. ✅ 通知系统

⏳ **待完成功能** (6个):
1. 🔴 权限增强系统
2. 🔴 数据备份/恢复
3. 🟡 客户管理模块
4. 🟡 移动端优化
5. 🟡 实时协作 (WebSocket)
6. 🟡 高级搜索/筛选

## 📖 详细文档

- [系统完整性评估报告](docs/系统完整性评估报告.md)
- [通知系统使用说明](docs/通知系统使用说明.md)

## 🔑 默认账号

```
用户名: admin
密码: 12345
```

## 📝 API接口

### 基础URL
```
http://localhost:3000/api
```

### 主要接口

#### 认证接口
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/refresh` - 刷新Token

#### 工单接口
- `GET /tasks` - 获取工单列表
- `POST /tasks` - 创建工单
- `PUT /tasks/:id` - 更新工单
- `DELETE /tasks/:id` - 删除工单

#### 通知接口
- `GET /notifications` - 获取通知列表
- `POST /notifications` - 创建通知
- `PUT /notifications/:id/read` - 标记已读
- `GET /notifications/unread-count` - 未读数量

#### 报表接口
- `GET /reports/overview` - 统计概览
- `GET /reports/staff-performance` - 员工绩效
- `GET /reports/time-trend` - 时间趋势
- `GET /reports/export/json` - JSON导出
- `GET /reports/export/csv` - CSV导出

更多接口详情请参考各路由文件。

## 🔧 配置说明

### 后端配置 (`backend/.env`)

```env
# 服务端口
PORT=3000

# JWT密钥（请修改为随机字符串）
JWT_SECRET=your-very-secure-random-secret-key

# DeepSeek API密钥（用于AI助手）
DEEPSEEK_API_KEY=sk-your-api-key-here

# 数据库路径（可选）
DB_PATH=./data/db.json

# 上传文件路径（可选）
UPLOAD_DIR=./uploads
```

### 前端配置 (`frontend/app-config.js`)

```javascript
// 后端API地址
const API_BASE_URL = 'http://localhost:3000';

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = 'sk-your-api-key-here';
```

## 🐛 常见问题

### 1. 启动失败
- 检查Node.js版本 (建议 v16+)
- 确认端口3000未被占用
- 检查 `.env` 文件配置

### 2. 通知不自动发送
- 确认后端服务正常运行
- 查看控制台调度器日志
- 检查 `db.json` 文件权限

### 3. AI助手无法使用
- 验证DeepSeek API Key是否正确
- 检查网络连接
- 查看浏览器控制台错误信息

### 4. 文件上传失败
- 检查 `uploads` 文件夹是否存在
- 确认文件大小不超过5MB
- 验证文件类型是否支持

## 🚧 开发计划

### v2.0 计划功能
- [ ] 权限管理系统 (RBAC)
- [ ] 数据库迁移 (JSON → PostgreSQL/MySQL)
- [ ] WebSocket实时协作
- [ ] 移动端响应式优化
- [ ] 邮件/短信通知
- [ ] 客户管理模块
- [ ] 工单模板系统
- [ ] 高级搜索引擎
- [ ] 数据备份/恢复
- [ ] 性能优化

## 📄 许可证

MIT License

## 👥 贡献者

- GitHub Copilot - AI开发助手

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件

---

**最后更新**: 2024年1月  
**版本**: v1.0  
**系统完整度**: 76%
