@echo off
REM SiaghSync Start Script for Windows
REM Simple batch file to start the application

echo.
echo ========================================
echo   SiaghSync - Starting Application
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dist folder exists
if not exist "dist" (
    echo [ERROR] dist folder not found!
    echo Please run deployment script first: deploy-windows.ps1
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Please create .env file from .env.example
    pause
    exit /b 1
)

echo Starting SiaghSync...
echo Press Ctrl+C to stop
echo.

node dist/main.js

pause

