@echo off
REM SiaghSync Database Migration Script (Batch version)
REM For full features, use: .\run-migrations.ps1

echo ======================================
echo    SiaghSync Database Migration
echo ======================================
echo.

REM Check for command line argument
if "%1"=="fix" goto FIX_MODE
if "%1"=="check" goto CHECK_MODE
goto NORMAL_MODE

:FIX_MODE
echo Showing permission fix instructions...
echo.
powershell.exe -ExecutionPolicy Bypass -File "run-migrations.ps1" -Fix
goto END

:CHECK_MODE
echo Checking database permissions...
echo.
powershell.exe -ExecutionPolicy Bypass -File "run-migrations.ps1" -Check
goto END

:NORMAL_MODE
echo Step 1: Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)
echo [SUCCESS] Prisma client generated
echo.

echo Step 2: Running migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo.
    echo [ERROR] Migration failed!
    echo.
    echo Common issues:
    echo   - Permission denied: Run "run-migrations.bat fix" for instructions
    echo   - Database doesn't exist: Create database first
    echo   - Cannot connect: Check if PostgreSQL is running
    echo.
    echo For detailed diagnostics, run:
    echo   powershell -ExecutionPolicy Bypass -File run-migrations.ps1 -Fix
    echo.
    pause
    exit /b 1
)

echo.
echo ======================================
echo   [SUCCESS] Migrations completed!
echo ======================================
echo.
echo Next steps:
echo   1. Check APIs: npm run check-apis
echo   2. Test all APIs: npm run test-all-apis
echo   3. Start app: node dist/src/main.js
echo.

:END
pause
