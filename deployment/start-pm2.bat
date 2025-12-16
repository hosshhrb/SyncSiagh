@echo off
echo Starting SiaghSync with PM2...
pm2 start dist/src/main.js --name siaghsync
pm2 save
pm2 monit
pause
