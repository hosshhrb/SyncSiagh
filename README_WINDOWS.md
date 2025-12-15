# 🪟 Windows Deployment - Start Here

## Quick Steps

1. **Install Node.js** - https://nodejs.org/ (LTS version)
2. **Build on Linux:**
   ```bash
   ./scripts/build-for-production.sh
   ```
3. **Copy `deployment/` folder to Windows**
4. **On Windows (PowerShell as Admin):**
   ```powershell
   cd C:\SiaghSync
   .\deploy-windows.ps1
   ```
5. **Edit `.env` file** - Add your CRM credentials
6. **Run:**
   ```powershell
   npx prisma migrate deploy
   node dist/main.js
   ```

**Logs appear in console!** ✅

---

## Detailed Guides

- **`WINDOWS_DEPLOY_STEPS.md`** - Complete step-by-step guide
- **`WINDOWS_CHECKLIST.md`** - Visual checklist
- **`WINDOWS_QUICK_START.md`** - Quick reference
- **`START_WINDOWS.md`** - Simple start guide

---

## What You Need

- Node.js 18+
- PostgreSQL (local or remote)
- Redis (local or remote)
- Administrator access

---

**Start with:** `WINDOWS_DEPLOY_STEPS.md` for detailed instructions! 🚀
