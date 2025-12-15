# ✅ Windows Deployment Checklist

Follow these steps in order.

---

## 📋 Before You Start

- [ ] Windows Server or Windows 10/11
- [ ] Administrator access
- [ ] Internet connection

---

## Step 1: Install Node.js

- [ ] Go to: https://nodejs.org/
- [ ] Download **LTS version** (v18+)
- [ ] Run installer
- [ ] Check "Automatically install tools"
- [ ] Complete installation
- [ ] Verify:
  ```powershell
  node --version  # Should show v18.x or higher
  npm --version   # Should show 9.x or higher
  ```

✅ **Step 1 Done!**

---

## Step 2: Install PostgreSQL

**Choose one:**

- [ ] **Option A:** Install PostgreSQL locally
  - Download: https://www.postgresql.org/download/windows/
  - Install with default settings
  - Remember the password!

- [ ] **Option B:** Use remote PostgreSQL
  - Get connection details (host, port, user, password)

- [ ] **Option C:** Use Docker
  ```powershell
  docker run -d --name siagh-postgres `
    -e POSTGRES_USER=siagh_user `
    -e POSTGRES_PASSWORD=siagh_pass `
    -e POSTGRES_DB=siagh_sync `
    -p 5432:5432 `
    postgres:16-alpine
  ```

✅ **Step 2 Done!**

---

## Step 3: Install Redis

**Choose one:**

- [ ] **Option A:** Install Redis locally
  - Download: https://github.com/tporadowski/redis/releases
  - Install with default settings

- [ ] **Option B:** Use remote Redis
  - Get connection details (host, port)

- [ ] **Option C:** Use Docker
  ```powershell
  docker run -d --name siagh-redis -p 6379:6379 redis:7-alpine
  ```

✅ **Step 3 Done!**

---

## Step 4: Get Deployment Files

**On your Linux machine:**
```bash
./scripts/build-for-production.sh
```

**Transfer to Windows:**
- [ ] Copy `deployment/` folder to Windows
- [ ] Place in: `C:\SiaghSync\` (or your preferred location)

**Transfer methods:**
- [ ] Network share
- [ ] USB drive
- [ ] SCP (if SSH enabled)
- [ ] Cloud storage (OneDrive, Dropbox, etc.)

✅ **Step 4 Done!**

---

## Step 5: Open PowerShell as Administrator

- [ ] Press `Win + X`
- [ ] Select **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
- [ ] Click **Yes** when prompted

✅ **Step 5 Done!**

---

## Step 6: Navigate to Folder

```powershell
cd C:\SiaghSync
```

- [ ] Verify you're in the right folder:
  ```powershell
  dir
  ```
  Should see: `dist/`, `package.json`, `deploy-windows.ps1`

✅ **Step 6 Done!**

---

## Step 7: Run Deployment Script

```powershell
.\deploy-windows.ps1
```

**The script will:**
- [ ] Check Node.js installation
- [ ] Install production dependencies
- [ ] Generate Prisma client
- [ ] Create .env file (if missing)

**Follow the prompts:**
- [ ] Answer questions when asked
- [ ] Wait for installation to complete

✅ **Step 7 Done!**

---

## Step 8: Configure .env File

```powershell
notepad .env
```

**Edit these values:**

- [ ] **DATABASE_URL** - Your PostgreSQL connection
  ```bash
  DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"
  ```

- [ ] **REDIS_HOST** and **REDIS_PORT** - Your Redis connection
  ```bash
  REDIS_HOST="localhost"
  REDIS_PORT=6379
  ```

- [ ] **CRM_USERNAME** - Your actual CRM username
  ```bash
  CRM_USERNAME="your-actual-username"
  ```

- [ ] **CRM_PASSWORD** - Your actual CRM password
  ```bash
  CRM_PASSWORD="your-actual-password"
  ```

- [ ] **FINANCE_PASSWORD** - If different, hash it first:
  ```powershell
  npm run hash-password your-password
  ```
  Then update in .env

**Save and close** (Ctrl+S, Alt+F4)

✅ **Step 8 Done!**

---

## Step 9: Setup Database

- [ ] **Create database** (if using local PostgreSQL):
  ```powershell
  psql -U postgres
  CREATE DATABASE siagh_sync;
  CREATE USER siagh_user WITH PASSWORD 'siagh_pass';
  GRANT ALL PRIVILEGES ON DATABASE siagh_sync TO siagh_user;
  \q
  ```

- [ ] **Run migrations:**
  ```powershell
  npx prisma migrate deploy
  ```

**Expected output:**
```
✅ Migrations applied successfully
```

✅ **Step 9 Done!**

---

## Step 10: Test Configuration

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

**If errors:**
- [ ] Check .env file has correct credentials
- [ ] Verify PostgreSQL is running
- [ ] Verify Redis is running

✅ **Step 10 Done!**

---

## Step 11: Run Application

```powershell
node dist/main.js
```

**You'll see:**
```
✅ Database connected
✅ Successfully authenticated with Payamgostar CRM
✅ Successfully authenticated with Siagh Finance API
🚀 SiaghSync is running on: http://localhost:3000
```

**Logs appear in console!**

**Press Ctrl+C to stop**

✅ **Step 11 Done!**

---

## Step 12: Verify It's Working

- [ ] **Test health endpoint:**
  ```powershell
  # Open another PowerShell window
  curl http://localhost:3000/health
  ```
  Should return: `{"status":"ok",...}`

- [ ] **View database logs:**
  ```powershell
  npm run prisma:studio
  ```
  Browser opens - check SyncLog table

✅ **Step 12 Done!**

---

## 🎉 All Done!

Your SiaghSync is running on Windows!

---

## 📊 Viewing Logs

### Console Logs
```powershell
node dist/main.js
# Logs appear in console
```

### PM2 Logs (if using PM2)
```powershell
pm2 logs siaghsync
```

### Database Logs
```powershell
npm run prisma:studio
# Opens browser - view SyncLog table
```

---

## 🔄 Run as Windows Service (Optional)

```powershell
# Install PM2
npm install -g pm2 pm2-windows-service

# Install as service
pm2-service-install

# Start
pm2 start dist/main.js --name siaghsync
pm2 save

# View logs
pm2 logs siaghsync
```

---

## 🆘 Troubleshooting

**Application won't start?**
```powershell
npm ci --production
npx prisma generate
```

**Database error?**
```powershell
Get-Service postgresql*  # Check if running
```

**Port in use?**
```powershell
netstat -ano | findstr :3000  # Find process
taskkill /PID <PID> /F  # Kill it
```

---

**You're ready!** Start with: `node dist/main.js` 🚀

