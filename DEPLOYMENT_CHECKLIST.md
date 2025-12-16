# Deployment Package Checklist

## ✅ What's Included in Deployment Directory

After running `./scripts/build-for-production.sh`, the `deployment/` folder contains:

### Core Application Files
- ✅ `dist/src/main.js` - Compiled application entry point
- ✅ `dist/src/` - All compiled TypeScript files
- ✅ `package.json` - Dependencies and scripts
- ✅ `package-lock.json` - Locked dependency versions

### Configuration
- ✅ `.env` - **Environment variables with credentials hardcoded!**
  - CRM API: `http://172.16.16.16` (webservice/12345678)
  - Finance API: `http://172.16.16.15` (مدیر سیستم/MD5 hash)
  - Database: PostgreSQL connection string
  - Redis: Connection settings
- ✅ `.env.example` - Backup template

### Database
- ✅ `prisma/` - Prisma schema and migrations
- ✅ `node_modules/.prisma/` - Generated Prisma client (if exists)

### Deployment Scripts
- ✅ `deploy-windows.ps1` - PowerShell deployment script
- ✅ `start.bat` - Quick start batch file
- ✅ `start-pm2.bat` - PM2 service start script
- ✅ `DEPLOYMENT-README.md` - Deployment guide

---

## ✅ Credentials Status

**All credentials are HARDCODED in `.env` file:**

```bash
# CRM (Payamgostar)
CRM_API_BASE_URL="http://172.16.16.16"
CRM_USERNAME="webservice"
CRM_PASSWORD="12345678"

# Finance (Siagh)
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"
```

**✅ No manual editing needed!** Just copy and run.

---

## ✅ Will It Work After Copying?

**YES!** If you copy the entire `deployment/` folder to Windows:

1. ✅ All files are included
2. ✅ Credentials are pre-configured
3. ✅ Scripts use correct paths (`dist/src/main.js`)
4. ✅ Dependencies will be installed by deploy script

**What you need on Windows:**
- Node.js 18+ installed
- PostgreSQL running (or update DATABASE_URL)
- Redis running (or update REDIS_HOST/PORT)

---

## 🚀 Quick Start on Windows

After copying `deployment/` folder:

```powershell
# 1. Navigate to deployment folder
cd C:\path\to\deployment

# 2. Run deployment script (as Administrator)
.\deploy-windows.ps1

# OR manually:
npm install --production
npx prisma generate
npx prisma migrate deploy
node dist/src/main.js
```

---

## ✅ Build Script Status

**The build script:**
- ✅ Copies all necessary files
- ✅ Includes `.env` with hardcoded credentials
- ✅ Creates deployment scripts with correct paths
- ✅ Generates archive for easy transfer

**Fixed issues:**
- ✅ Path corrected: `dist/src/main.js` (not `dist/main.js`)
- ✅ Deploy script uses fixed PowerShell script
- ✅ Batch files use correct paths

---

## 📋 Verification

To verify deployment package is complete:

```bash
# On Linux (after build)
cd deployment
ls -la

# Should see:
# - dist/src/main.js ✅
# - .env ✅
# - package.json ✅
# - prisma/ ✅
# - deploy-windows.ps1 ✅
```

---

**Everything is ready! Just copy `deployment/` folder to Windows and run!** 🚀
