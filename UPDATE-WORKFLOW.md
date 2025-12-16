# Update Workflow - Step by Step

## 🚨 **RIGHT NOW - Fix Your Current Issue**

On your Windows server, run this in PowerShell as Administrator:

```powershell
cd C:\Users\adminapp\SyncSiagh\deployment

# Install dependencies
npm ci --production

# Generate Prisma client
npx prisma generate

# Test it works
npm run check-apis
```

**That's it!** Your current issue is fixed.

---

## 📦 **For Future Updates**

### One-Time Setup: Transfer the New Scripts

1. **Transfer the new `deployment` folder to your Windows server** (overwrite the old one)
   - This includes the new `update.ps1` script

You can use:
- WinSCP
- FileZilla
- Or any file transfer tool you prefer

### Every Time You Push New Code

#### On Linux (Your Dev Machine):
```bash
git pull origin main            # Get latest code
./scripts/quick-deploy.sh       # Build deployment package
```

#### Transfer to Windows:
- Copy the `deployment` folder to Windows server (overwrite existing files)

#### On Windows Server (PowerShell as Administrator):
```powershell
cd C:\Users\adminapp\SyncSiagh\deployment

# Simple update with one command
.\update.ps1 -CheckAPIs -Restart
```

**Done!** The script will:
- ✅ Stop the app automatically
- ✅ Install new dependencies
- ✅ Regenerate Prisma client
- ✅ Check API connectivity
- ✅ Restart the app automatically

---

## 🎯 **What Each Script Does**

### `deploy-windows.ps1` - First-Time Setup
Use this **ONLY** for initial installation or major changes:
```powershell
.\deploy-windows.ps1
```

### `update.ps1` - Regular Updates
Use this **EVERY TIME** you deploy new code:
```powershell
# Interactive mode
.\update.ps1

# With API check
.\update.ps1 -CheckAPIs

# Fully automated (recommended)
.\update.ps1 -CheckAPIs -Restart
```

---

## 📋 **Quick Command Reference**

### Windows Server Commands

| What You Want | Command |
|---------------|---------|
| Fix "module not found" | `npm ci --production` then `npx prisma generate` |
| Update after new code | `.\update.ps1 -CheckAPIs -Restart` |
| Check APIs | `npm run check-apis` |
| Start app | `node dist/src/main.js` |
| Start with PM2 | `pm2 start dist/src/main.js --name siaghsync` |
| View logs | `pm2 logs siaghsync` |
| Restart | `pm2 restart siaghsync` |
| Stop | `pm2 stop siaghsync` |

### Linux Commands

| What You Want | Command |
|---------------|---------|
| Build for deployment | `./scripts/quick-deploy.sh` |
| Update code | `git pull origin main` |

---

## 🔄 **Complete Update Example**

Let's say you just pushed new code:

**1. On Linux:**
```bash
git pull origin main
./scripts/quick-deploy.sh
```

**2. Transfer** the `deployment` folder to Windows

**3. On Windows PowerShell:**
```powershell
cd C:\Users\adminapp\SyncSiagh\deployment
.\update.ps1 -CheckAPIs -Restart
```

**That's it!** Your app is updated and running.

---

## 🆘 **Troubleshooting**

### "Cannot find module" error
```powershell
npm ci --production
npx prisma generate
```

### Database migration issues
```powershell
npx prisma migrate deploy
```

### API connectivity issues
Check your `.env` file has correct:
- `CRM_BASE_URL` and `CRM_API_TOKEN`
- `SIAGH_BASE_URL`, `SIAGH_USERNAME`, `SIAGH_PASSWORD`
- `DATABASE_URL`
- `REDIS_HOST` and `REDIS_PORT`

Test with:
```powershell
npm run check-apis
```

### App won't start
```powershell
# Check what's running
pm2 list

# Check logs
pm2 logs siaghsync

# Restart
pm2 restart siaghsync

# Or delete and recreate
pm2 delete siaghsync
pm2 start dist/src/main.js --name siaghsync
pm2 save
```

---

## 💡 **Pro Tips**

1. **Always use `update.ps1`** for regular updates - it handles everything automatically
2. **Run with `-CheckAPIs`** to verify your API connections after updating
3. **Use PM2** instead of running manually - it keeps your app running even after server restart
4. **Keep your `.env` file** - the update script preserves it automatically
5. **Check logs first** if something goes wrong: `pm2 logs siaghsync`

---

## ✅ **What's Different Now**

### Before (Old Workflow):
- ❌ Had to manually reinstall dependencies
- ❌ Could forget to regenerate Prisma client
- ❌ Manual stop/start process
- ❌ Easy to miss steps

### Now (New Workflow):
- ✅ One command does everything: `.\update.ps1 -CheckAPIs -Restart`
- ✅ Automatic dependency installation
- ✅ Automatic Prisma client generation
- ✅ Automatic stop/restart
- ✅ Built-in API connectivity check
- ✅ No missed steps

---

Need help? Check the complete guide in `QUICK-START.md`
