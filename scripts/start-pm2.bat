@echo off
REM SiaghSync PM2 Start Script for Windows
REM Starts the application with PM2 for service management

echo.
echo ========================================
echo   SiaghSync - Starting with PM2
echo ========================================
echo.

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PM2 is not installed
    echo Installing PM2...
    npm install -g pm2 pm2-windows-service
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install PM2
        pause
        exit /b 1
    )
)

REM Check if dist folder exists
if not exist "dist" (
    echo [ERROR] dist folder not found!
    echo Please run deployment script first: deploy-windows.ps1
    pause
    exit /b 1
)

echo Starting SiaghSync with PM2...
echo.

REM Stop existing instance if running
pm2 stop siaghsync 2>nul
pm2 delete siaghsync 2>nul

REM Start application
pm2 start dist/main.js --name siaghsync

REM Save PM2 configuration
pm2 save

echo.
echo Application started!
echo.
echo Useful commands:
echo   pm2 logs siaghsync    - View logs
echo   pm2 monit             - Monitor
echo   pm2 stop siaghsync    - Stop
echo   pm2 restart siaghsync - Restart
echo.

REM Open PM2 monitor
pm2 monit

pause

