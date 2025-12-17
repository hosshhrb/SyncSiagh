@echo off
REM SiaghSync Database Migration Batch Script
REM This script runs database migrations for production deployment
REM Usage:
REM   run-migrations.bat              - Run migrations
REM   run-migrations.bat fix          - Fix permissions and run migrations

echo.
echo =========================================
echo SiaghSync Database Migration
echo =========================================
echo.

REM Check if fix-permissions argument is passed
if "%1"=="fix" (
    echo Running with permission fix...
    powershell -ExecutionPolicy Bypass -File "%~dp0run-migrations.ps1" -FixPermissions
) else (
    echo Running migrations...
    powershell -ExecutionPolicy Bypass -File "%~dp0run-migrations.ps1"
)

echo.
pause
