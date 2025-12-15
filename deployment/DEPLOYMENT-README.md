# SiaghSync Windows Deployment Guide

## Quick Start

1. **Copy this entire folder to Windows server**

2. **Run deployment script:**
   ```powershell
   # Right-click PowerShell -> Run as Administrator
   .\deploy-windows.ps1
   ```

3. **Edit .env file** with your credentials

4. **Run initial import (one-time):**
   ```powershell
   node dist/main.js
   # In another terminal:
   npm run initial-import
   ```

5. **Start application:**
   ```powershell
   node dist/main.js
   ```

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
pm2 start dist/main.js --name siaghsync
pm2 save
```

## Troubleshooting

- Check logs in application output
- Verify database connection
- Check Redis connection
- Review .env configuration
