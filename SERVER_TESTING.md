# Server Testing Guide

Quick guide to deploy and test SiaghSync on a server.

---

## ⚡ Fastest Way (Same Machine)

If testing on the same Linux machine:

```bash
# 1. Build
./scripts/build-for-production.sh

# 2. Deploy locally
cd deployment
npm ci --production
npx prisma generate

# 3. Configure
cp .env.example .env
nano .env  # Add your CRM credentials

# 4. Setup database (if not done)
npx prisma migrate deploy

# 5. Run and see logs
node dist/main.js
```

**Logs appear in console!** Perfect for testing.

---

## 🚀 Deploy to Remote Server

### Option 1: Automated Script

```bash
# Deploy to remote Linux server
./scripts/deploy-to-server.sh user@server-ip

# Example:
./scripts/deploy-to-server.sh root@192.168.1.100
```

Then SSH to server and:
```bash
cd /opt/siaghsync
cp .env.example .env
nano .env
npx prisma migrate deploy
node dist/main.js
```

### Option 2: Manual Steps

**On your machine (build):**
```bash
./scripts/build-for-production.sh
```

**Transfer to server:**
```bash
# Using SCP
scp -r deployment/ user@server:/opt/siaghsync/

# Or using archive
scp siaghsync-deployment-*.tar.gz user@server:/opt/
```

**On server:**
```bash
cd /opt/siaghsync

# Extract if using archive
tar -xzf siaghsync-deployment-*.tar.gz

# Setup
npm ci --production
npx prisma generate
cp .env.example .env
nano .env  # Configure credentials
npx prisma migrate deploy

# Run
node dist/main.js
```

---

## 🪟 Deploy to Windows Server

**On Linux (build):**
```bash
./scripts/build-for-production.sh
```

**Transfer to Windows:**
- Copy `deployment/` folder to Windows
- Or use network share, USB, etc.

**On Windows:**
```powershell
# Right-click PowerShell -> Run as Administrator
cd C:\SiaghSync
.\deploy-windows.ps1
```

Follow the prompts. It will:
- Install dependencies
- Generate Prisma client
- Create .env file
- Run migrations
- Start application

---

## 📊 See Logs on Server

### Real-Time Console Logs

```bash
# Development mode (best for testing)
npm run start:dev

# Production mode
node dist/main.js
```

**You'll see:**
- ✅ Database connected
- ✅ CRM authenticated
- ✅ Finance authenticated
- 🔄 Sync operations
- 📨 Webhook events
- ⚠️ Errors

### PM2 Logs (Production)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/main.js --name siaghsync

# View logs
pm2 logs siaghsync

# Follow logs
pm2 logs siaghsync --lines 0
```

### Database Logs

```bash
# Open Prisma Studio
npm run prisma:studio

# View SyncLog table for all sync operations
```

---

## 🧪 Testing Checklist

### 1. Verify Setup

```bash
# Check status
npm run status

# Test APIs
npm run check-apis
```

### 2. Test Application

```bash
# Start application
npm run start:dev

# In another terminal, test health
curl http://localhost:3000/health
```

### 3. Test Sync

```bash
# Run initial import
npm run initial-import

# Watch logs for sync operations
npm run start:dev
```

### 4. Monitor

```bash
# View database logs
npm run prisma:studio

# Check SyncLog table
```

---

## 🔧 Server Prerequisites

### Required

- **Node.js 18+** - `node --version`
- **PostgreSQL** - Running and accessible
- **Redis** - Running and accessible

### Check Prerequisites

```bash
# Node.js
node --version  # Should be v18.x or higher

# PostgreSQL
docker ps | grep postgres
# or
systemctl status postgresql

# Redis
docker ps | grep redis
# or
redis-cli ping  # Should return PONG
```

---

## 📝 Configuration

Edit `.env` on server:

```bash
# Database (server's PostgreSQL)
DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"

# Redis (server's Redis)
REDIS_HOST="localhost"
REDIS_PORT=6379

# CRM (your credentials)
CRM_USERNAME="your-username"
CRM_PASSWORD="your-password"

# Finance (already configured from docs)
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="MD5_HASH_HERE"
```

---

## 🎯 Quick Test Commands

```bash
# 1. Build
./scripts/build-for-production.sh

# 2. Deploy (local)
cd deployment && npm ci --production && npx prisma generate

# 3. Configure
cp .env.example .env && nano .env

# 4. Migrate
npx prisma migrate deploy

# 5. Test APIs
npm run check-apis

# 6. Run with logs
node dist/main.js
```

---

## 🆘 Quick Troubleshooting

**Application won't start?**
```bash
# Check Node.js
node --version

# Check dependencies
npm ci --production

# Check .env
cat .env | grep -v PASSWORD
```

**Database connection failed?**
```bash
# Check PostgreSQL
docker ps | grep postgres

# Test connection
psql -U siagh_user -d siagh_sync
```

**No logs showing?**
```bash
# Run in development mode
npm run start:dev

# Or check PM2
pm2 logs siaghsync
```

---

## 📚 More Information

- `DEPLOY_TO_SERVER.md` - Complete deployment guide
- `DEPLOYMENT.md` - Windows deployment details
- `HOW_TO_RUN.md` - How to run and see logs

---

**Ready to test!** Start with: `npm run start:dev` 🚀

