@echo off
REM Run Prisma migrations on Windows deployment
echo Running Prisma migrations...
npx prisma migrate deploy
echo.
echo Migrations completed!
pause
