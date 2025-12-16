# 🪟 Windows Deployment - Final Steps with Actual Configuration

Everything is configured with your actual CRM and Finance APIs.

---

## ✅ What's Configured

### CRM (Payamgostar)
- **URL:** `http://172.16.16.16`
- **Username:** `webservice`
- **Password:** `12345678`
- **Endpoint:** `/api/v2/auth/login`

### Finance (Siagh)
- **URL:** `http://172.16.16.15`
- **Username:** `مدیر سیستم`
- **Password:** `92C0ED8C3EC1DD67D834D3005A592A80` (MD5 hashed)
- **Endpoint:** `/GeneralApi/LoginUser`

---

## 🚀 Deploy to Windows (3 Steps)

### Step 1: Build on Linux

```bash
cd /home/h/SiaghSync
./scripts/build-for-production.sh
```

**Output:**
- `deployment/` folder created
- `siaghsync-deployment-*.tar.gz` archive created

### Step 2: Transfer to Windows

**Choose one method:**

**A. Network Share:**
- Map network drive to Windows server
- Copy `deployment/` folder to Windows (e.g., `C:\SiaghSync`)

**B. USB Drive:**
- Copy `deployment/` folder to USB
- Copy from USB to Windows

**C. SCP (if SSH enabled on Windows):**
```bash
scp -r deployment/ user@windows-ip:/C:/SiaghSync/
```

**D. Cloud Storage:**
- Upload to OneDrive/Dropbox
- Download on Windows

### Step 3: Setup on Windows

1. **Open PowerShell as Administrator:**
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)"

2. **Navigate to folder:**
   ```powershell
   cd C:\SiaghSync
   ```

3. **Run deployment script:**
   ```powershell
   .\deploy-windows.ps1
   ```

4. **Follow prompts:**
   - Installs dependencies ✅
   - Generates Prisma client ✅
   - Creates .env file ✅

5. **Edit .env (only if credentials changed):**
   ```powershell
   notepad .env
   ```
   The file already has correct CRM and Finance credentials!

6. **Setup database:**
   ```powershell
   # Make sure PostgreSQL is running
   # Then run migrations
   npx prisma migrate deploy
   ```

7. **Run application:**
   ```powershell
   node dist/main.js
   ```

**Logs appear in console!** ✅

---

## 📊 What You'll See

```
✅ Database connected
✅ Successfully authenticated with Payamgostar CRM
   URL: http://172.16.16.16/api/v2/auth/login
   Username: webservice
✅ Successfully authenticated with Siagh Finance API
   SessionId: 5e311c4b2e...
   Fiscal Year: 1404
🚀 SiaghSync is running on: http://localhost:3000
```

---

## 🧪 Test It

### Test APIs
```powershell
npm run check-apis
```

**Expected:**
```
✅ Database connected
✅ CRM token configured: eyJhbGci...
✅ Finance session obtained: 5e311c...
✅ API connectivity check completed!
```

### Test Health
```powershell
curl http://localhost:3000/health
```

**Expected:**
```json
{"status":"ok","timestamp":"...","service":"SiaghSync"}
```

### Run Initial Import
```powershell
npm run initial-import
```

Imports all customers from Finance to CRM.

---

## 📝 Configuration Summary

Your `.env` file has:

```bash
# Database
DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"

# CRM (your actual API)
CRM_API_BASE_URL="http://172.16.16.16"
CRM_USERNAME="webservice"
CRM_PASSWORD="12345678"

# Finance (your actual API)
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
```

---

## 🔄 Run as Windows Service

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

# Monitor
pm2 monit
```

---

## 🆘 Troubleshooting

### Can't connect to CRM

**Check:**
- CRM server is accessible: `ping 172.16.16.16`
- Port is open
- Credentials are correct

### Can't connect to Finance

**Check:**
- Finance server is accessible: `ping 172.16.16.15`
- Port is open
- Password is MD5 hashed

### Database error

```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Or start Docker container
docker run -d --name siagh-postgres `
  -e POSTGRES_USER=siagh_user `
  -e POSTGRES_PASSWORD=siagh_pass `
  -e POSTGRES_DB=siagh_sync `
  -p 5432:5432 `
  postgres:16-alpine
```

---

## 📚 Documentation

- `WINDOWS_DEPLOY_STEPS.md` - Step-by-step guide
- `WINDOWS_CHECKLIST.md` - Visual checklist
- `CRM_API_ACTUAL.md` - CRM API documentation
- `SIAGH_INTEGRATION.md` - Finance API documentation

---

**Everything is configured!** Just build, transfer, and run! 🚀

