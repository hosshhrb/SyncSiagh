# SiaghSync Windows Deployment Guide

## Quick Start

### First-Time Setup

1. **Copy this entire folder to Windows server**

2. **Run deployment script:**
   ```powershell
   # Right-click PowerShell -> Run as Administrator
   .\deploy-windows.ps1
   ```

3. **Edit .env file** with your credentials

4. **Check API connectivity:**
   ```powershell
   npm run check-apis
   ```

5. **Run initial import (one-time):**
   ```powershell
   node dist/src/main.js
   # In another terminal:
   npm run initial-import
   ```

6. **Start application:**
   ```powershell
   node dist/src/main.js
   # Or with PM2:
   pm2 start dist/src/main.js --name siaghsync
   pm2 save
   ```

### Updating After Code Changes

When you receive updated files:

1. **Transfer new files** to this directory (overwrite existing files)

2. **Run update script:**
   ```powershell
   # Right-click PowerShell -> Run as Administrator
   .\update.ps1
   ```

   **Options:**
   - `.\update.ps1` - Interactive update
   - `.\update.ps1 -CheckAPIs` - Update and check APIs
   - `.\update.ps1 -CheckAPIs -Restart` - Update, check APIs, and restart automatically

The update script will:
- Stop the application (if running with PM2)
- Install new dependencies
- Regenerate Prisma client
- Run migrations (optional)
- Check APIs (optional)
- Restart the application

## Prerequisites

- **Node.js 18+** - Download from https://nodejs.org/
- **PostgreSQL** - Running and accessible
- **Redis** - Running and accessible (or use cloud Redis)

## Configuration

Edit `.env` file with:
- Database connection string
- CRM credentials
- Finance (Siagh) credentials
- Redis connection

## Running as Windows Service

Install PM2 Windows Service:

```powershell
npm install -g pm2 pm2-windows-service
pm2-service-install
pm2 start dist/src/main.js --name siaghsync
pm2 save
```

## Troubleshooting

- Check logs in application output
- Verify database connection
- Check Redis connection
- Review .env configuration
