@echo off
echo ========================================
echo  工程安装月历管理系统 - 启动脚本
echo ========================================
echo.

REM 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    pause
    exit /b
)

echo [信息] Node.js版本:
node --version
echo.

REM 检查backend目录
if not exist "backend" (
    echo [错误] 找不到backend目录
    pause
    exit /b
)

cd backend

REM 检查node_modules
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    echo.
    npm install
    echo.
    if %ERRORLEVEL% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b
    )
    echo [成功] 依赖安装完成
    echo.
)

REM 检查.env文件
if not exist ".env" (
    echo [警告] 未找到.env文件，正在创建默认配置...
    echo PORT=3000 > .env
    echo JWT_SECRET=your-secret-key-change-this-in-production >> .env
    echo DEEPSEEK_API_KEY=sk-your-deepseek-api-key >> .env
    echo.
    echo [提示] 已创建.env文件，请修改其中的API密钥
    echo.
)

REM 检查data目录
if not exist "data" (
    echo [提示] 创建数据目录...
    mkdir data
)

REM 检查uploads目录
if not exist "uploads" (
    echo [提示] 创建上传目录...
    mkdir uploads
)

echo ========================================
echo  正在启动后端服务...
echo ========================================
echo.
echo [访问地址]
echo - 登录页面: http://localhost:3000/frontend/login.html
echo - 主系统: http://localhost:3000/frontend/installation_schedule.html
echo - 通知中心: http://localhost:3000/frontend/notification-center.html
echo - 数据报表: http://localhost:3000/frontend/reports.html
echo.
echo [默认账号]
echo - 用户名: admin
echo - 密码: 12345
echo.
echo ========================================
echo  按 Ctrl+C 停止服务
echo ========================================
echo.

npm start
