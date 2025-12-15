# Step-by-Step: Deploy to Windows Server

Complete step-by-step guide to deploy and run SiaghSync on Windows.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] Windows Server or Windows 10/11
- [ ] Administrator access
- [ ] Internet connection
- [ ] PostgreSQL installed (or access to remote PostgreSQL)
- [ ] Redis installed (or access to remote Redis)

---

## Step 1: Install Node.js

### 1.1 Download Node.js

1. Go to: https://nodejs.org/
2. Download **LTS version** (v18 or higher)
3. Choose **Windows Installer (.msi)** for 64-bit

### 1.2 Install Node.js

1. Run the downloaded `.msi` file
2. Click **Next** through the installer
3. **Important:** Check "Automatically install the necessary tools"
4. Click **Install**
5. Wait for installation to complete
6. Click **Finish**

### 1.3 Verify Installation

1. Open **PowerShell** (Right-click → Run as Administrator)
2. Run:
   ```powershell
   node --version
   ```
   Should show: `v18.x.x` or higher

3. Run:
   ```powershell
   npm --version
   ```
   Should show: `9.x.x` or higher

✅ **Step 1 Complete!**

---

## Step 2: Install PostgreSQL (if not installed)

### Option A: Install PostgreSQL Locally

1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. Set password for `postgres` user (remember this!)
4. Port: `5432` (default)
5. Complete installation

### Option B: Use Remote PostgreSQL

If you have remote PostgreSQL, skip this step and use its connection details in Step 5.

### Option C: Use Docker (if Docker Desktop installed)

```powershell
docker run -d --name siagh-postgres `
  -e POSTGRES_USER=siagh_user `
  -e POSTGRES_PASSWORD=siagh_pass `
  -e POSTGRES_DB=siagh_sync `
  -p 5432:5432 `
  postgres:16-alpine
```

✅ **Step 2 Complete!**

---

## Step 3: Install Redis (if not installed)

### Option A: Install Redis Locally

1. Download from: https://github.com/microsoftarchive/redis/releases
2. Or use: https://github.com/tporadowski/redis/releases
3. Run installer
4. Port: `6379` (default)

### Option B: Use Remote Redis

If you have remote Redis, skip this step and use its connection details in Step 5.

### Option C: Use Docker (if Docker Desktop installed)

```powershell
docker run -d --name siagh-redis `
  -p 6379:6379 `
  redis:7-alpine
```

✅ **Step 3 Complete!**

---

## Step 4: Transfer Files to Windows

### Option A: From Linux Development Machine

**On Linux:**
```bash
# Build deployment package
cd /home/h/SiaghSync
./scripts/build-for-production.sh

# Transfer to Windows (choose one method)
```

**Transfer Methods:**

1. **Using SCP (if SSH enabled on Windows):**
   ```bash
   scp -r deployment/ user@windows-ip:/C:/SiaghSync/
   ```

2. **Using Network Share:**
   ```bash
   # Mount Windows share on Linux
   sudo mkdir /mnt/windows
   sudo mount -t cifs //windows-ip/share /mnt/windows -o username=user
   
   # Copy files
   cp -r deployment/* /mnt/windows/SiaghSync/
   ```

3. **Using USB Drive:**
   ```bash
   # Copy to USB
   cp -r deployment/* /media/usb/SiaghSync/
   # Then copy from USB to Windows
   ```

4. **Using Archive:**
   ```bash
   # Create archive
   tar -czf siaghsync.zip -C deployment .
   
   # Transfer archive
   scp siaghsync.zip user@windows-ip:/C:/SiaghSync/
   ```

### Option B: Build on Windows (if you have source code)

If you have the source code on Windows:

```powershell
# Install dependencies
npm install

# Build
npm run build

# You're ready for Step 5
```

✅ **Step 4 Complete!**

---

## Step 5: Setup on Windows

### 5.1 Extract Files (if using archive)

```powershell
# Navigate to where you copied files
cd C:\SiaghSync

# Extract archive (if using .zip)
Expand-Archive -Path siaghsync.zip -DestinationPath .

# Or extract .tar.gz using 7-Zip or WinRAR
```

### 5.2 Run Deployment Script

1. **Open PowerShell as Administrator:**
   - Press `Win + X`
   - Select **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**

2. **Navigate to deployment folder:**
   ```powershell
   cd C:\SiaghSync
   # or wherever you copied the files
   ```

3. **Run deployment script:**
   ```powershell
   .\deploy-windows.ps1
   ```

4. **Follow the prompts:**
   - It will check Node.js ✅
   - Install dependencies ✅
   - Generate Prisma client ✅
   - Create .env file ✅

### 5.3 Configure Environment

1. **Open .env file:**
   ```powershell
   notepad .env
   ```

2. **Edit these values:**

   ```bash
   # Database - Use your PostgreSQL connection
   DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"
   # If using remote PostgreSQL:
   # DATABASE_URL="postgresql://user:pass@remote-ip:5432/siagh_sync"
   
   # Redis - Use your Redis connection
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   # If using remote Redis:
   # REDIS_HOST="remote-ip"
   # REDIS_PORT=6379
   
   # CRM - YOUR ACTUAL CREDENTIALS
   CRM_API_BASE_URL="https://crm.payamgostar.com"
   CRM_USERNAME="your-actual-username"  # ← Change this
   CRM_PASSWORD="your-actual-password"  # ← Change this
   
   # Finance (Siagh) - Already configured from your docs
   FINANCE_API_BASE_URL="http://172.16.16.15"
   FINANCE_USERNAME="مدیر سیستم"
   FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"
   # If your password is different, hash it first:
   # npm run hash-password your-password
   ```

3. **Save and close** (Ctrl+S, Alt+F4)

✅ **Step 5 Complete!**

---

## Step 6: Setup Database

### 6.1 Create Database (if using local PostgreSQL)

1. **Open pgAdmin** (if installed) or use **psql**

2. **Or use PowerShell:**
   ```powershell
   # Connect to PostgreSQL
   psql -U postgres
   # Enter your postgres password
   
   # Create database and user
   CREATE DATABASE siagh_sync;
   CREATE USER siagh_user WITH PASSWORD 'siagh_pass';
   GRANT ALL PRIVILEGES ON DATABASE siagh_sync TO siagh_user;
   \q
   ```

### 6.2 Run Migrations

```powershell
# In PowerShell (in deployment folder)
npx prisma migrate deploy
```

**Expected output:**
```
✅ Migrations applied successfully
```

✅ **Step 6 Complete!**

---

## Step 7: Test Configuration

### 7.1 Test APIs

```powershell
npm run check-apis
```

**Expected output:**
```
✅ Database connected
✅ CRM token configured
✅ Finance session obtained
✅ API connectivity check completed!
```

If you see errors:
- Check `.env` file has correct credentials
- Verify PostgreSQL is running
- Verify Redis is running (or disable if not needed for testing)

✅ **Step 7 Complete!**

---

## Step 8: Run Application

### Option A: Run Manually (Best for Testing)

```powershell
# In PowerShell
node dist/main.js
```

**You'll see logs in the console:**
```
✅ Database connected
✅ Successfully authenticated with Payamgostar CRM
✅ Successfully authenticated with Siagh Finance API
🚀 SiaghSync is running on: http://localhost:3000
```

**Press Ctrl+C to stop**

### Option B: Run with PM2 (Production)

```powershell
# Install PM2 globally
npm install -g pm2 pm2-windows-service

# Start application
pm2 start dist/main.js --name siaghsync

# View logs
pm2 logs siaghsync

# Save configuration
pm2 save
```

### Option C: Run as Windows Service

```powershell
# Install PM2 as Windows Service
pm2-service-install

# Start application
pm2 start dist/main.js --name siaghsync
pm2 save

# Service will auto-start on boot
```

✅ **Step 8 Complete!**

---

## Step 9: Verify It's Working

### 9.1 Check Health Endpoint

Open another PowerShell window:

```powershell
# Test health endpoint
curl http://localhost:3000/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"...","service":"SiaghSync"}
```

### 9.2 Check Logs

**If running manually:**
- Logs appear in the console window

**If using PM2:**
```powershell
pm2 logs siaghsync
```

### 9.3 View Database Logs

```powershell
# Open Prisma Studio
npm run prisma:studio
```

Browser opens at `http://localhost:5555`
- Navigate to **SyncLog** table
- See all sync operations

✅ **Step 9 Complete!**

---

## Step 10: Run Initial Import (One-Time)

```powershell
# In PowerShell (in deployment folder)
npm run initial-import
```

This will:
- Fetch all customers from Finance (Siagh)
- Import them to CRM
- Create entity mappings

**Watch the console for progress!**

✅ **Step 10 Complete!**

---

## 🎉 You're Done!

Your SiaghSync is now running on Windows!

---

## 📊 Viewing Logs

### Real-Time Console Logs

```powershell
# If running manually
node dist/main.js
# Logs appear in console

# If using PM2
pm2 logs siaghsync
```

### Database Logs

```powershell
npm run prisma:studio
# Opens browser - view SyncLog table
```

---

## 🔄 Common Commands

```powershell
# Start application
node dist/main.js

# Start with PM2
pm2 start dist/main.js --name siaghsync

# View logs
pm2 logs siaghsync

# Stop application
pm2 stop siaghsync

# Restart
pm2 restart siaghsync

# Test APIs
npm run check-apis

# View database
npm run prisma:studio
```

---

## 🆘 Troubleshooting

### Application Won't Start

1. **Check Node.js:**
   ```powershell
   node --version  # Should be 18+
   ```

2. **Check dependencies:**
   ```powershell
   npm ci --production
   ```

3. **Check .env file:**
   ```powershell
   Get-Content .env
   ```

4. **Check database:**
   ```powershell
   npx prisma studio
   # If fails, check DATABASE_URL in .env
   ```

### Database Connection Failed

1. **Check PostgreSQL is running:**
   ```powershell
   Get-Service postgresql*
   ```

2. **Test connection:**
   ```powershell
   psql -U siagh_user -d siagh_sync -h localhost
   ```

3. **Check firewall:**
   - Allow PostgreSQL port (5432) in Windows Firewall

### Port Already in Use

```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change PORT in .env
```

---

## 📚 Next Steps

1. **Monitor sync operations:**
   - Watch console logs
   - Check Prisma Studio

2. **Run initial import:**
   ```powershell
   npm run initial-import
   ```

3. **Set up as Windows Service:**
   ```powershell
   pm2-service-install
   pm2 start dist/main.js --name siaghsync
   pm2 save
   ```

---

**You're all set!** Start with: `node dist/main.js` and watch the logs! 🚀

