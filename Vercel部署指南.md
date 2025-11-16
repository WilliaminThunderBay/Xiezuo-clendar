# 🚀 Vercel部署步骤指南

## ✅ 准备工作已完成

- ✅ 已创建 `vercel.json` 配置文件
- ✅ 已创建 `.vercelignore` 忽略文件
- ✅ 已安装 Vercel CLI
- ✅ 项目结构已优化

---

## 📝 第一步：登录Vercel

在命令行运行以下命令：

```bash
vercel login
```

**选择登录方式：**
- GitHub（推荐）
- GitLab  
- Bitbucket
- Email

按提示完成登录验证。

---

## 🚀 第二步：部署项目

### 方法A：交互式部署（推荐新手）

```bash
cd e:\Work\xiezuoCalendar
vercel
```

**按照提示回答：**

1. **Set up and deploy?** → 按 `Y` (Yes)

2. **Which scope?** → 选择你的账号（回车）

3. **Link to existing project?** → 按 `N` (No，首次部署)

4. **What's your project's name?** → 输入：`xiezuo-calendar` 或自定义

5. **In which directory is your code located?** → 按回车（当前目录 `./`）

6. **Want to override the settings?** → 按 `N` (No，使用vercel.json配置)

等待部署完成！

---

### 方法B：一键部署（快速）

```bash
cd e:\Work\xiezuoCalendar
vercel --prod
```

直接部署到生产环境。

---

## 🔧 第三步：配置环境变量

部署成功后，需要在Vercel Dashboard配置环境变量：

### 1. 访问项目设置
```
https://vercel.com/your-username/xiezuo-calendar/settings/environment-variables
```

### 2. 添加以下环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 生产环境标识 |
| `JWT_SECRET` | `你的强密钥` | JWT加密密钥 |
| `DEEPSEEK_API_KEY` | `sk-your-api-key` | DeepSeek API密钥 |

**生成JWT密钥：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 重新部署（使环境变量生效）

```bash
vercel --prod
```

---

## ✨ 第四步：访问部署的网站

部署成功后，Vercel会提供URL：

```
https://xiezuo-calendar.vercel.app
```

或自定义域名：
```
https://your-domain.com
```

### 主要页面：

- **主日历：** https://your-app.vercel.app/installation_schedule.html
- **登录页面：** https://your-app.vercel.app/frontend/login.html
- **测试页面：** https://your-app.vercel.app/test_ai_schedule.html

---

## 🎯 第五步：测试功能

### 1. 测试基础功能
- ✅ 访问主页是否正常
- ✅ 登录功能（admin / 12345）
- ✅ 日历显示
- ✅ 创建/编辑工单

### 2. 测试AI助手
- ✅ 打开AI助手窗口
- ✅ 输入创建日程指令
- ✅ 验证工单是否创建成功

### 3. 测试API
```bash
# 测试登录API
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"12345"}'
```

---

## 🔄 更新部署

### 本地修改后重新部署：

```bash
# 1. 提交代码
git add .
git commit -m "更新功能"

# 2. 重新部署
vercel --prod

# 或者让Vercel自动部署（连接Git仓库）
```

### 自动部署（推荐）

1. 将代码推送到GitHub
2. 在Vercel Dashboard连接Git仓库
3. 每次推送代码自动部署

---

## 🌐 自定义域名（可选）

### 1. 在Vercel添加域名

访问：`https://vercel.com/your-username/xiezuo-calendar/settings/domains`

点击 **Add Domain**，输入你的域名：`calendar.yourdomain.com`

### 2. 配置DNS

在你的域名提供商添加CNAME记录：

```
类型: CNAME
主机记录: calendar
记录值: cname.vercel-dns.com
TTL: 600
```

### 3. 等待生效（1-24小时）

Vercel会自动配置HTTPS证书。

---

## 📊 Vercel限制说明

### 免费计划限制：

| 项目 | 免费额度 | 说明 |
|------|---------|------|
| 带宽 | 100GB/月 | 30人团队够用 |
| 执行时间 | 10秒/请求 | Serverless函数 |
| 部署次数 | 无限制 | - |
| 团队成员 | 1人 | Hobby计划 |
| 自定义域名 | 无限制 | 免费HTTPS |

### Pro计划（如需要）：

- **价格：** $20/月
- **带宽：** 1TB/月
- **执行时间：** 60秒/请求
- **团队成员：** 无限制

---

## ⚠️ 注意事项

### 1. WebSocket支持
Vercel的Serverless架构对WebSocket支持有限，实时协作功能可能受影响。

**解决方案：**
- 使用轮询代替WebSocket（需修改代码）
- 或部署到支持WebSocket的云服务器

### 2. 文件存储
Vercel的文件系统是只读的，上传的文件不会持久化。

**解决方案：**
- 使用外部存储（如AWS S3、阿里云OSS）
- 或改用数据库存储

### 3. 数据库
JSON文件存储在Vercel上不会持久化。

**解决方案：**
- 使用Vercel Postgres（免费）
- 或使用MongoDB Atlas（免费）
- 或使用Supabase（免费）

---

## 🛠️ 常见问题

### Q1: 部署失败怎么办？

**检查：**
```bash
# 查看部署日志
vercel logs

# 检查配置
vercel env ls
```

### Q2: 如何回滚到之前的版本？

在Vercel Dashboard → Deployments → 选择之前的部署 → Promote to Production

### Q3: 如何查看日志？

```bash
# 实时日志
vercel logs --follow

# 查看最近日志
vercel logs
```

### Q4: API请求失败？

检查环境变量是否配置正确：
```bash
vercel env ls
```

---

## 📈 性能优化建议

### 1. 启用边缘缓存

在 `vercel.json` 添加：
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    }
  ]
}
```

### 2. 使用边缘函数

将高频API改为Edge Functions，降低延迟。

### 3. 优化静态资源

压缩图片、合并CSS/JS文件。

---

## 🎯 下一步建议

如果Vercel部署遇到以下问题：

1. **WebSocket不工作** → 考虑云服务器方案
2. **文件上传失败** → 使用对象存储
3. **数据不持久化** → 改用数据库

**推荐：**
- 测试演示用Vercel ✅
- 生产环境用云服务器 ✅

---

## 🆘 获取帮助

- Vercel文档：https://vercel.com/docs
- Vercel社区：https://github.com/vercel/vercel/discussions
- 项目Issues：提交问题和建议

---

**准备好了吗？开始部署吧！** 🚀

运行命令：
```bash
vercel login
vercel
```
