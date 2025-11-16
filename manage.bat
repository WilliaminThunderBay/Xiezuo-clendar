@echo off
chcp 65001 >nul
title 工程安装月历管理系统

:menu
cls
echo ========================================
echo  工程安装月历管理系统 - 管理脚本
echo ========================================
echo.
echo  1. 启动服务器
echo  2. 停止服务器
echo  3. 重启服务器
echo  4. 重置数据库
echo  5. 查看服务状态
echo  6. 安装/更新依赖
echo  7. 清理缓存
echo  8. 查看日志
echo  9. 退出
echo.
echo ========================================
set /p choice=请选择操作 (1-9): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto reset
if "%choice%"=="5" goto status
if "%choice%"=="6" goto install
if "%choice%"=="7" goto clean
if "%choice%"=="8" goto logs
if "%choice%"=="9" goto exit

echo 无效的选择，请重新输入
timeout /t 2 >nul
goto menu

:start
cls
echo ========================================
echo  启动服务器
echo ========================================
echo.

REM 检查Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    pause
    goto menu
)

echo [信息] Node.js版本:
node --version
echo.

REM 检查backend目录
if not exist "backend" (
    echo [错误] 找不到backend目录
    pause
    goto menu
)

cd backend

REM 检查node_modules
if not exist "node_modules" (
    echo [提示] 正在安装依赖...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo [错误] 依赖安装失败
        cd ..
        pause
        goto menu
    )
)

REM 检查.env文件
if not exist ".env" (
    echo [警告] 未找到.env文件，正在创建默认配置...
    echo PORT=3000 > .env
    echo JWT_SECRET=your-secret-key-change-this-in-production >> .env
    echo DEEPSEEK_API_KEY=sk-your-deepseek-api-key >> .env
    echo.
)

REM 检查data目录
if not exist "data" (
    mkdir data
)

REM 检查uploads目录
if not exist "uploads" (
    mkdir uploads
)

echo ========================================
echo  服务器启动中...
echo ========================================
echo.
echo [访问地址]
echo - 主页: http://localhost:3000/
echo - 登录: http://localhost:3000/frontend/login.html
echo - 日历: http://localhost:3000/frontend/installation_schedule.html
echo - 通知: http://localhost:3000/frontend/notification-center.html
echo - 报表: http://localhost:3000/frontend/reports.html
echo.
echo [默认账号]
echo - 用户名: admin
echo - 密码: 12345
echo.
echo ========================================
echo  按 Ctrl+C 停止服务，然后按任意键返回菜单
echo ========================================
echo.

npm start

cd ..
pause
goto menu

:stop
cls
echo ========================================
echo  停止服务器
echo ========================================
echo.

REM 查找并终止Node.js进程
echo 正在查找运行中的Node.js进程...
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3000') do (
    echo 发现端口3000被进程 %%i 占用
    taskkill /PID %%i /F
    echo 进程已终止
)

echo.
echo 服务器已停止
pause
goto menu

:restart
cls
echo ========================================
echo  重启服务器
echo ========================================
echo.

echo 正在停止服务器...
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%i /F >nul 2>nul
)

timeout /t 2 >nul
echo 服务器已停止
echo.
echo 正在启动服务器...
goto start

:reset
cls
echo ========================================
echo  重置数据库
echo ========================================
echo.
echo [警告] 此操作将删除所有数据！
echo.
set /p confirm=确定要重置数据库吗？(Y/N): 

if /i "%confirm%" neq "Y" (
    echo 操作已取消
    pause
    goto menu
)

if exist "backend\data\db.json" (
    del "backend\data\db.json"
    echo 数据库已删除
) else (
    echo 数据库文件不存在
)

echo.
echo 数据库将在下次启动时自动初始化
echo 默认管理员账号: admin / 12345
pause
goto menu

:status
cls
echo ========================================
echo  服务状态
echo ========================================
echo.

REM 检查端口3000
netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% equ 0 (
    echo [状态] 服务器正在运行
    echo.
    echo [端口占用情况]
    netstat -ano | findstr :3000
) else (
    echo [状态] 服务器未运行
)

echo.
echo [Node.js版本]
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    node --version
) else (
    echo Node.js未安装
)

echo.
echo [NPM版本]
where npm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    npm --version
) else (
    echo NPM未安装
)

echo.
echo [数据库文件]
if exist "backend\data\db.json" (
    echo 存在 - backend\data\db.json
    for %%A in ("backend\data\db.json") do echo 大小: %%~zA 字节
) else (
    echo 不存在
)

pause
goto menu

:install
cls
echo ========================================
echo  安装/更新依赖
echo ========================================
echo.

if not exist "backend" (
    echo [错误] 找不到backend目录
    pause
    goto menu
)

cd backend

echo 正在安装依赖包...
npm install

if %ERRORLEVEL% equ 0 (
    echo.
    echo [成功] 依赖安装完成
    echo.
    echo [已安装的包]
    npm list --depth=0
) else (
    echo [错误] 依赖安装失败
)

cd ..
pause
goto menu

:clean
cls
echo ========================================
echo  清理缓存
echo ========================================
echo.

set /p confirm=确定要清理node_modules和缓存吗？(Y/N): 

if /i "%confirm%" neq "Y" (
    echo 操作已取消
    pause
    goto menu
)

if exist "backend\node_modules" (
    echo 正在删除 node_modules...
    rmdir /s /q "backend\node_modules"
    echo node_modules 已删除
)

if exist "backend\package-lock.json" (
    echo 正在删除 package-lock.json...
    del "backend\package-lock.json"
    echo package-lock.json 已删除
)

echo.
echo 清理完成！请运行"安装/更新依赖"重新安装
pause
goto menu

:logs
cls
echo ========================================
echo  查看日志
echo ========================================
echo.

if exist "backend\data\db.json" (
    echo [数据库内容预览]
    type "backend\data\db.json" | more
) else (
    echo 数据库文件不存在
)

echo.
pause
goto menu

:exit
cls
echo ========================================
echo  感谢使用！
echo ========================================
echo.

REM 停止服务器
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%i /F >nul 2>nul
)

exit
