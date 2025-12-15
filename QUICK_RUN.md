# Quick Run Guide

Fastest way to get SiaghSync running and see logs.

---

## ⚡ Super Quick Start

```bash
# 1. Configure (edit with your credentials)
cp .env.example .env
nano .env

# 2. Hash Siagh password
npm run hash-password your-password
# Copy the hash to FINANCE_PASSWORD in .env

# 3. Start everything
docker-compose up -d
npm run prisma:generate
npm run prisma:migrate

# 4. Test and run
npm run check-apis
npm run start:dev
```

---

## 📝 Configuration (.env)

Based on your Siagh documentation:

```bash
# Finance (Siagh) - Your actual values
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="MD5_HASH_HERE"  # Use: npm run hash-password

# CRM (Payamgostar) - Your actual values
CRM_API_BASE_URL="https://crm.payamgostar.com"
CRM_USERNAME="your-username"
CRM_PASSWORD="your-password"

# Database
DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
```

---

## 🎯 See Logs

### Option 1: Development Mode (Recommended)
```bash
npm run start:dev
```
**Shows:** All logs in console, auto-reload on changes

### Option 2: Test Script
```bash
./scripts/test-with-logs.sh
```
**Shows:** Infrastructure check + API test + Application logs

### Option 3: PM2 (Production)
```bash
npm run build
pm2 start dist/main.js --name siaghsync
pm2 logs siaghsync
```

### Option 4: Database Logs
```bash
npm run prisma:studio
# Opens browser - view SyncLog table
```

---

## 📊 What Logs Show

**Startup:**
```
✅ Database connected
✅ Successfully authenticated with Payamgostar CRM
✅ Successfully authenticated with Siagh Finance API
🚀 SiaghSync is running on: http://localhost:3000
```

**Sync Operations:**
```
🔄 Starting sync: CRM -> Finance | Customer abc-123
✅ Successfully updated Finance customer 12345
```

**Polling (every 5 minutes):**
```
🔄 Polling CRM for customer changes...
Found 3 updated customers in CRM
✅ Queued 3 customers for sync
```

**Webhooks:**
```
📨 Received CRM webhook: customer.updated
✅ Webhook queued for processing
```

---

## 🧪 Test It

```bash
# 1. Test APIs
npm run check-apis

# 2. Run initial import (one-time)
npm run initial-import

# 3. Start application
npm run start:dev

# 4. Watch logs in console
# 5. Check database: npm run prisma:studio
```

---

## 🆘 Quick Troubleshooting

**Can't connect to database?**
```bash
docker-compose restart postgres
```

**Authentication failed?**
```bash
# Check credentials in .env
# For Siagh: Make sure password is MD5 hashed
npm run hash-password your-password
```

**No logs showing?**
```bash
# Check if application is running
curl http://localhost:3000/health

# Check PM2 if using it
pm2 logs siaghsync
```

---

**That's it!** Start with `npm run start:dev` and watch the logs! 🚀

