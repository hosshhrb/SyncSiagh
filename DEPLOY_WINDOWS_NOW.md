# Deploy to Windows - Do This Now

Complete steps with your actual API configuration.

---

## ✅ APIs Configured

- **CRM:** `http://172.16.16.16` (webservice/12345678)
- **Finance:** `http://172.16.16.15` (مدیر سیستم/MD5_HASH)

---

## 🚀 Step 1: Build on Linux

On your Linux machine (Fedora):

```bash
cd /home/h/SiaghSync
./scripts/build-for-production.sh
```

**Wait for it to complete...**

You'll see:
```
✅ Build completed successfully!
📦 Deployment package created:
   Directory: deployment
   Archive: siaghsync-deployment-*.tar.gz
```

---

## 📦 Step 2: Transfer to Windows

Copy the **`deployment/`** folder to your Windows server.

**Method 1: Network Share**
1. Open Windows Explorer on Windows
2. Share a folder (e.g., `C:\Deploy`)
3. On Linux:
   ```bash
   # Mount the share
   sudo mkdir /mnt/windows
   sudo mount -t cifs //WINDOWS-IP/Deploy /mnt/windows -o username=YourWindowsUser
   
   # Copy files
   cp -r deployment/* /mnt/windows/SiaghSync/
   ```

**Method 2: USB Drive**
1. Copy `deployment/` to USB drive on Linux
2. Plug USB into Windows
3. Copy from USB to `C:\SiaghSync\`

**Method 3: Cloud Storage**
1. Upload `siaghsync-deployment-*.tar.gz` to cloud
2. Download on Windows
3. Extract to `C:\SiaghSync\`

---

## 🪟 Step 3: Install Prerequisites on Windows

### 3.1 Install Node.js

1. Go to: https://nodejs.org/
2. Download **LTS version** (v22 or v20)
3. Run installer
4. Check all default options
5. **Restart PowerShell** after installation

Verify:
```powershell
node --version
npm --version
```

### 3.2 Install PostgreSQL

**Option A: Install Locally**
1. Download: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Set password for `postgres` user
4. Remember the password!

**Option B: Use Docker**
```powershell
docker run -d --name siagh-postgres `
  -e POSTGRES_USER=siagh_user `
  -e POSTGRES_PASSWORD=siagh_pass `
  -e POSTGRES_DB=siagh_sync `
  -p 5432:5432 `
  postgres:16-alpine
```

### 3.3 Install Redis

**Option A: Install from GitHub**
1. Download: https://github.com/tporadowski/redis/releases
2. Download latest `.msi` file
3. Run installer

**Option B: Use Docker**
```powershell
docker run -d --name siagh-redis `
  -p 6379:6379 `
  redis:7-alpine
```

---

## ⚙️ Step 4: Setup on Windows

### 4.1 Open PowerShell as Administrator

1. Press `Win + X`
2. Select **"Windows PowerShell (Admin)"**
3. Click **Yes** when prompted

### 4.2 Navigate to Folder

```powershell
cd C:\SiaghSync
# Or wherever you copied the deployment folder
```

### 4.3 Check Files

```powershell
dir
```

You should see:
- `dist/` folder
- `package.json`
- `prisma/` folder
- `deploy-windows.ps1`
- `start.bat`

### 4.4 Run Deployment Script

```powershell
.\deploy-windows.ps1
```

**The script will:**
1. Check Node.js ✅
2. Install dependencies ✅
3. Generate Prisma client ✅
4. Create .env file ✅

**Follow the prompts and answer questions.**

---

## 📝 Step 5: Configure (If Needed)

The `.env` file is already configured with your APIs!

**Only edit if you need to change something:**
```powershell
notepad .env
```

**Check these values:**
```bash
# CRM - Already configured
CRM_API_BASE_URL="http://172.16.16.16"
CRM_USERNAME="webservice"
CRM_PASSWORD="12345678"

# Finance - Already configured
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"

# Database - Update if different
DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"

# Redis - Update if different
REDIS_HOST="localhost"
REDIS_PORT=6379
```

---

## 🗄️ Step 6: Setup Database

### 6.1 Create Database (if using local PostgreSQL)

```powershell
# Open psql
psql -U postgres

# In psql, run:
CREATE DATABASE siagh_sync;
CREATE USER siagh_user WITH PASSWORD 'siagh_pass';
GRANT ALL PRIVILEGES ON DATABASE siagh_sync TO siagh_user;
\q
```

### 6.2 Run Migrations

```powershell
npx prisma migrate deploy
```

**Expected:**
```
✅ Migrations applied successfully
```

---

## 🧪 Step 7: Test APIs

```powershell
npm run check-apis
```

**Expected:**
```
✅ Database connected
✅ CRM token configured: eyJhbGci...
   URL: http://172.16.16.16/api/v2/auth/login
   Username: webservice
✅ Finance session obtained: 5e311c4b...
✅ API connectivity check completed!
```

**If errors:**
- Check CRM server is accessible: `ping 172.16.16.16`
- Check Finance server is accessible: `ping 172.16.16.15`
- Verify PostgreSQL is running
- Check Redis is running

---

## 🎯 Step 8: Run Application

```powershell
node dist/main.js
```

**You'll see logs in the console:**
```
[Nest] Starting Nest application...
✅ Database connected
[CrmAuthService] Authenticating with Payamgostar CRM...
   URL: http://172.16.16.16/api/v2/auth/login
   Username: webservice
✅ Successfully authenticated with Payamgostar CRM
[FinanceAuthService] Authenticating with Siagh Finance API...
✅ Successfully authenticated with Siagh Finance API
   SessionId: 5e311c4b2e...
   Fiscal Year: 1404
🚀 SiaghSync is running on: http://localhost:3000
```

**Press Ctrl+C to stop**

---

## 🔄 Step 9: Run Initial Import (One-Time)

**In another PowerShell window:**

```powershell
npm run initial-import
```

**This will:**
- Fetch all customers from Finance (Siagh)
- Import them to CRM (Payamgostar)
- Create entity mappings
- Show progress in console

**Watch the main window for sync logs!**

---

## 📊 Step 10: Monitor

### View Logs

**Console logs (real-time):**
- Running in the PowerShell window where you ran `node dist/main.js`

**Database logs:**
```powershell
# In another PowerShell window
npm run prisma:studio
```
Opens browser → Navigate to **SyncLog** table

### Check Health

```powershell
curl http://localhost:3000/health
```

---

## 🔧 Step 11: Run as Windows Service (Optional)

```powershell
# Install PM2 globally
npm install -g pm2 pm2-windows-service

# Install PM2 as Windows Service
pm2-service-install

# Stop manual process first (Ctrl+C in the other window)

# Start with PM2
pm2 start dist/main.js --name siaghsync
pm2 save

# View logs
pm2 logs siaghsync

# Monitor
pm2 monit
```

**Service will auto-start on Windows boot!**

---

## ✅ You're Done!

Your SiaghSync is running on Windows with:
- ✅ Real CRM API (http://172.16.16.16)
- ✅ Real Finance API (http://172.16.16.15)
- ✅ Two-way sync
- ✅ Automatic retry
- ✅ Complete logging

---

## 📚 Useful Commands

```powershell
# Check status
npm run status

# Test APIs
npm run check-apis

# View logs (if using PM2)
pm2 logs siaghsync

# View database
npm run prisma:studio

# Stop service
pm2 stop siaghsync

# Restart service
pm2 restart siaghsync
```

---

## 🆘 Quick Fixes

**Can't connect to CRM?**
```powershell
ping 172.16.16.16
# Make sure it's reachable
```

**Can't connect to Finance?**
```powershell
ping 172.16.16.15
# Make sure it's reachable
```

**Database error?**
```powershell
# Check PostgreSQL
Get-Service postgresql*

# Or restart Docker container
docker start siagh-postgres
```

**Redis error?**
```powershell
# Check Redis
redis-cli ping

# Or restart Docker container
docker start siagh-redis
```

---

**Start with Step 1!** Build, transfer, deploy, and run! 🚀

