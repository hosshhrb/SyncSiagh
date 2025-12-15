# ⚡ Windows Quick Start

Fastest way to get SiaghSync running on Windows.

---

## 🎯 5-Minute Setup

### Step 1: Install Node.js

1. Download: https://nodejs.org/ (LTS version)
2. Install with default options
3. Verify:
   ```powershell
   node --version
   npm --version
   ```

### Step 2: Get Files

**From Linux:**
```bash
./scripts/build-for-production.sh
# Copy deployment/ folder to Windows
```

**Or build on Windows:**
```powershell
npm install
npm run build
```

### Step 3: Setup

```powershell
# Navigate to deployment folder
cd C:\SiaghSync

# Run deployment script (as Administrator)
.\deploy-windows.ps1
```

### Step 4: Configure

```powershell
# Edit .env file
notepad .env
```

**Change these:**
```bash
CRM_USERNAME="your-username"
CRM_PASSWORD="your-password"
```

### Step 5: Database

```powershell
# Make sure PostgreSQL is running
# Then run migrations
npx prisma migrate deploy
```

### Step 6: Run

```powershell
node dist/main.js
```

**Logs appear in console!** ✅

---

## 📊 See Logs

```powershell
# Run application
node dist/main.js

# Logs show:
# ✅ Database connected
# ✅ CRM authenticated
# ✅ Finance authenticated
# 🔄 Sync operations
```

---

## 🧪 Test

```powershell
# Test APIs
npm run check-apis

# Test health
curl http://localhost:3000/health

# View database
npm run prisma:studio
```

---

## 🔄 Run as Service

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

**That's it!** See `WINDOWS_DEPLOY_STEPS.md` for detailed steps.

