# Deployment Scripts Quick Reference

## 📦 Build Script (Linux)

**File:** `scripts/build-for-production.sh`

**Usage:**
```bash
chmod +x scripts/build-for-production.sh
./scripts/build-for-production.sh
```

**What it does:**
- Builds TypeScript to JavaScript
- Creates deployment package
- Generates Windows deployment scripts
- Creates compressed archive

**Output:**
- `deployment/` folder - Ready to transfer
- `siaghsync-deployment-*.tar.gz` - Compressed archive

---

## 🪟 Windows Deployment Script

**File:** `scripts/deploy-windows.ps1`

**Usage:**
```powershell
# Right-click PowerShell -> Run as Administrator
.\deploy-windows.ps1
```

**What it does:**
- Checks prerequisites (Node.js, npm)
- Installs production dependencies
- Generates Prisma client
- Creates .env file if missing
- Optionally runs database migrations
- Optionally installs PM2 service

---

## 🚀 Start Scripts (Windows)

### Simple Start
**File:** `scripts/start.bat`

**Usage:**
```cmd
start.bat
```

Starts application directly with Node.js.

### PM2 Start
**File:** `scripts/start-pm2.bat`

**Usage:**
```cmd
start-pm2.bat
```

Starts application with PM2 for service management.

---

## 📋 Quick Deployment Workflow

### 1. Build on Linux
```bash
cd /path/to/SiaghSync
./scripts/build-for-production.sh
```

### 2. Transfer to Windows
```bash
# Option A: SCP
scp -r deployment/ user@windows:/C:/SiaghSync/

# Option B: Network share
cp -r deployment/* /mnt/windows/SiaghSync/

# Option C: Archive
scp siaghsync-deployment-*.tar.gz user@windows:/C:/SiaghSync/
```

### 3. Deploy on Windows
```powershell
# Extract (if archive)
tar -xzf siaghsync-deployment-*.tar.gz

# Run deployment (as Administrator)
.\deploy-windows.ps1

# Edit .env
notepad .env

# Run initial import
npm run initial-import

# Start application
node dist/main.js
# Or: start.bat
# Or: start-pm2.bat
```

---

## 🔧 Prerequisites

### Linux (Development)
- Node.js 18+
- npm
- tar, gzip

### Windows (Production)
- Node.js 18+ (https://nodejs.org/)
- PostgreSQL (or cloud database)
- Redis (or cloud Redis)
- PowerShell 5.1+ (for deployment script)

---

## 📚 Full Documentation

See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete deployment guide.

