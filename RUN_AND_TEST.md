# How to Run and Test SiaghSync

Complete guide for running the application and viewing logs.

---

## 🚀 Quick Start

### Step 1: Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual credentials
nano .env  # or use your preferred editor
```

**Required Configuration:**
```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# CRM (Payamgostar)
CRM_API_BASE_URL="https://crm.payamgostar.com"
CRM_USERNAME="your-actual-username"
CRM_PASSWORD="your-actual-password"

# Finance (Siagh) - Based on your documentation
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
# Hash your password first:
npm run hash-password your-actual-password
# Copy the output to FINANCE_PASSWORD
FINANCE_PASSWORD="MD5_HASH_HERE"
```

### Step 2: Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Step 3: Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Step 4: Test API Connectivity

```bash
# Test both CRM and Finance APIs
npm run check-apis
```

**Expected Output:**
```
🔍 Checking API connectivity...

📡 Testing CRM API...
   ✅ CRM token configured: abc123...
   Fetching customers...
   ✅ Successfully fetched 5 customers
   ✅ Webhooks supported

📡 Testing Finance API...
   Authenticating...
   ✅ Finance session obtained: xyz789...
   Fetching customers...
   ✅ Successfully fetched 5 customers

✅ API connectivity check completed!
```

---

## 🏃 Running the Application

### Development Mode (with logs)

```bash
npm run start:dev
```

**What you'll see:**
- Application starting
- Database connection
- API authentication
- Sync operations
- Real-time logs

### Production Mode

```bash
# Build first
npm run build

# Run
npm run start:prod
```

### With PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/main.js --name siaghsync

# View logs
pm2 logs siaghsync

# Monitor
pm2 monit

# Stop
pm2 stop siaghsync
```

---

## 📊 Viewing Logs

### Real-Time Application Logs

**Development mode:**
```bash
npm run start:dev
# Logs appear in console
```

**Production with PM2:**
```bash
# View all logs
pm2 logs siaghsync

# View last 100 lines
pm2 logs siaghsync --lines 100

# Follow logs (like tail -f)
pm2 logs siaghsync --lines 0

# View error logs only
pm2 logs siaghsync --err

# View output logs only
pm2 logs siaghsync --out
```

**Save logs to file:**
```bash
# PM2
pm2 logs siaghsync --out siaghsync.log --err siaghsync-error.log

# Direct output
npm run start:dev > siaghsync.log 2>&1
```

### Database Logs (Sync Operations)

**Using Prisma Studio:**
```bash
npm run prisma:studio
```

Then navigate to:
- **SyncLog** table - All sync operations with full details
- **EntityMapping** table - Entity links between systems
- **WebhookSubscription** table - Webhook registrations

**Using SQL:**
```bash
# Connect to database
psql -U siagh_user -d siagh_sync

# View recent sync logs
SELECT * FROM "SyncLog" ORDER BY "startedAt" DESC LIMIT 10;

# View failed syncs
SELECT * FROM "SyncLog" WHERE status = 'FAILED' ORDER BY "startedAt" DESC;

# View sync statistics
SELECT 
  status, 
  COUNT(*) as count,
  AVG("durationMs") as avg_duration_ms
FROM "SyncLog" 
WHERE "startedAt" > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### Docker Logs

```bash
# PostgreSQL logs
docker-compose logs postgres

# Redis logs
docker-compose logs redis

# All services
docker-compose logs -f
```

---

## 🧪 Testing Sync Operations

### Test 1: Initial Import (One-Time)

```bash
# Run initial import from Finance to CRM
npm run initial-import
```

**What to watch:**
- Console output showing import progress
- Number of customers imported
- Any errors or skipped customers

**Check results:**
```bash
# Open Prisma Studio
npm run prisma:studio

# Check EntityMapping table for new mappings
# Check SyncLog table for import operations
```

### Test 2: Manual Customer Sync

```bash
# Start application
npm run start:dev

# In another terminal, trigger manual sync
# (You'll need to create a test script or use the API)
```

### Test 3: Webhook Test

```bash
# Start application
npm run start:dev

# In another terminal, send test webhook
curl -X POST http://localhost:3000/webhook/crm \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: test" \
  -d '{
    "eventId": "test-123",
    "eventType": "customer.updated",
    "entityType": "CUSTOMER",
    "entityId": "CUSTOMER_ID_HERE",
    "timestamp": "2024-12-15T12:00:00Z"
  }'
```

**Watch logs for:**
- Webhook received
- Job queued
- Sync processing
- Success/failure

### Test 4: Polling Test

```bash
# Start application
npm run start:dev

# Wait 5 minutes (or change POLL_INTERVAL_SECONDS in .env)
# Watch logs for polling messages:
# "🔄 Polling CRM for customer changes..."
# "Found X updated customers in CRM"
```

---

## 📝 Understanding Log Messages

### Application Startup

```
✅ Database connected
✅ Successfully authenticated with Payamgostar CRM
✅ Successfully authenticated with Siagh Finance API
🚀 SiaghSync is running on: http://localhost:3000
```

### Sync Operations

```
🔄 Starting sync: CRM -> Finance | Customer abc-123
   Updating existing Finance customer: 12345
✅ Successfully updated Finance customer 12345
```

### Errors

```
❌ Sync failed: Customer not found: xyz-789
   Error: Finance API request failed: 404 Not Found
```

### Polling

```
🔄 Polling CRM for customer changes...
Found 3 updated customers in CRM
✅ Queued 3 customers for sync
```

### Webhooks

```
📨 Received CRM webhook: customer.updated - CUSTOMER
✅ Webhook queued for processing: event-123
```

---

## 🔍 Debugging

### Enable Verbose Logging

Edit `.env`:
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

### Check Application Health

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-15T12:00:00.000Z",
  "service": "SiaghSync"
}
```

### Check Queue Status

If using PM2:
```bash
pm2 list
pm2 info siaghsync
```

### Common Issues

**1. Database connection failed**
```
❌ Error: P1001: Can't reach database server
```
**Solution:** Check PostgreSQL is running and DATABASE_URL is correct

**2. Authentication failed**
```
❌ CRM authentication failed: Invalid credentials
```
**Solution:** Check CRM_USERNAME and CRM_PASSWORD in .env

**3. Finance authentication failed**
```
❌ Siagh Finance authentication failed
```
**Solution:** 
- Verify password is MD5 hashed: `npm run hash-password`
- Check FINANCE_USERNAME and FINANCE_PASSWORD

**4. No syncs happening**
```
# Check logs for:
- Polling messages (every 5 minutes)
- Webhook messages (if enabled)
- Error messages
```

---

## 📊 Monitoring Dashboard

### Prisma Studio (Database Viewer)

```bash
npm run prisma:studio
```

Opens browser at `http://localhost:5555`

**Useful views:**
- **SyncLog** - Filter by status, date, entity type
- **EntityMapping** - See all linked entities
- **Search** - Find specific sync operations

### PM2 Monitoring

```bash
pm2 monit
```

Shows:
- CPU usage
- Memory usage
- Logs
- Process status

---

## 🎯 Quick Test Checklist

- [ ] Infrastructure running (PostgreSQL, Redis)
- [ ] Database migrated (`npm run prisma:migrate`)
- [ ] APIs connected (`npm run check-apis`)
- [ ] Application starts (`npm run start:dev`)
- [ ] Health check works (`curl http://localhost:3000/health`)
- [ ] Initial import runs (`npm run initial-import`)
- [ ] Logs visible in console
- [ ] Database logs visible in Prisma Studio

---

## 📚 Useful Commands Summary

```bash
# Setup
npm install
cp .env.example .env
# Edit .env with credentials
docker-compose up -d
npm run prisma:generate
npm run prisma:migrate

# Testing
npm run check-apis          # Test API connectivity
npm run initial-import      # One-time import
npm run hash-password       # Hash Siagh password

# Running
npm run start:dev           # Development with logs
npm run start:prod          # Production
pm2 start dist/main.js      # With PM2

# Logs
pm2 logs siaghsync          # PM2 logs
npm run prisma:studio       # Database viewer
docker-compose logs -f      # Docker logs

# Monitoring
curl http://localhost:3000/health
pm2 monit
```

---

## 🆘 Getting Help

If something doesn't work:

1. **Check logs** - Application, database, Docker
2. **Verify configuration** - .env file, credentials
3. **Test connectivity** - `npm run check-apis`
4. **Check database** - Prisma Studio
5. **Review documentation** - TROUBLESHOOTING.md

---

**Ready to sync!** 🚀

