# 🪟 Windows Deployment - Start Here

## Quick Reference

**Your APIs:**
- CRM: `http://172.16.16.16` (webservice/12345678)
- Finance: `http://172.16.16.15` (مدیر سیستم/MD5)

---

## 3 Simple Steps

### 1. Build on Linux
```bash
./scripts/build-for-production.sh
```

### 2. Copy `deployment/` to Windows
Place in `C:\SiaghSync`

### 3. On Windows (PowerShell as Admin)
```powershell
cd C:\SiaghSync
.\deploy-windows.ps1
npx prisma migrate deploy
node dist/main.js
```

**Logs appear in console!**

---

## Detailed Guides

📖 **`WINDOWS_START.txt`** - Simple text guide (read this first!)
📖 **`DEPLOY_WINDOWS_NOW.md`** - Complete step-by-step
📖 **`WINDOWS_DEPLOY_STEPS.md`** - Detailed with troubleshooting
📖 **`WINDOWS_FINAL_STEPS.md`** - Reference guide

---

## What You Need on Windows

- Node.js 18+ (https://nodejs.org/)
- PostgreSQL (local or remote)
- Redis (local or remote)
- Administrator access

---

## Configuration (Already Done!)

Your `.env` has:
```bash
CRM_API_BASE_URL="http://172.16.16.16"
CRM_USERNAME="webservice"
CRM_PASSWORD="12345678"

FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"
```

---

**Start with: `WINDOWS_START.txt`** 🚀
