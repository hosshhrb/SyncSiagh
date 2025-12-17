# SiaghSync - Complete Guide

A production-ready middleware for bidirectional synchronization between CRM (Payamgostar) and Siagh Finance System (سیاق).

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Usage](#usage)
- [Monitoring & Logs](#monitoring--logs)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Overview

SiaghSync is a synchronization engine that acts as a middleware layer between:
- **CRM System**: Payamgostar (source of truth for customer data)
- **Finance System**: Siagh (سیاق) v8.3.1404.20812 (accounting/reporting)

**Sync Strategy:**
1. **Initial Import**: Finance → CRM (one-time setup)
2. **Ongoing Sync**: CRM → Finance (continuous, real-time)
3. **Conflict Resolution**: CRM always wins

---

## Features

- Two-way synchronization between CRM and Finance systems
- Dual sync modes: Polling and webhook-based event processing
- Conflict resolution: Last-write-wins strategy (CRM priority)
- Loop prevention: Intelligent detection to prevent infinite sync loops
- Idempotency: All operations are idempotent and safe to retry
- Comprehensive traceability: Full audit log of all sync operations
- Background job processing: Async processing with BullMQ and Redis
- Type-safe: Full TypeScript coverage
- Duplicate prevention via customer number matching

---

## Architecture

### Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Job Queue**: BullMQ with Redis
- **HTTP Client**: Axios

### Project Structure

```
src/
├── config/           # Configuration management
├── crm/             # CRM API client and authentication
├── finance/         # Finance API client and authentication
├── sync/            # Core sync logic
│   ├── orchestrator/  # Sync orchestration and entity-specific logic
│   ├── jobs/          # Background job processors
│   ├── webhook/       # Webhook handlers
│   └── strategy/      # Conflict resolution and loop detection
├── database/        # Prisma service and repositories
└── common/          # Shared utilities and types
```

### Data Flow

```
CRM creates/updates identity
        ↓
POST /webhook/crm/identity
        ↓
CrmWebhookController
  - Logs headers & payload
  - Queues job
        ↓
SyncJobProcessor
  - processCrmIdentityWebhook()
        ↓
CrmIdentityToSiaghService.syncIdentity()
  ├─ Fetch from CRM
  ├─ Check in Siagh (by RecordId or customerNumber)
  ├─ Create or Update in Siagh
  └─ Store mapping
        ↓
✅ SYNCED
```

---

## Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Docker and Docker Compose** (for development)
- **PostgreSQL** (or use Docker)
- **Redis** (or use Docker)

### Installation (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Hash Siagh password (REQUIRED!)
npm run hash-password your-siagh-password
# Copy the MD5 hash to FINANCE_PASSWORD in .env

# 5. Initialize database
npm run prisma:generate
npm run prisma:migrate

# 6. Run initial import (one-time)
npm run initial-import

# 7. Start application
npm run start:dev
```

---

## Configuration

### Environment Variables (.env)

```bash
# ============================================
# Database
# ============================================
DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"

# ============================================
# Redis
# ============================================
REDIS_HOST="localhost"
REDIS_PORT=6379

# ============================================
# CRM System (Payamgostar)
# ============================================
CRM_API_BASE_URL="https://crm.payamgostar.com"
CRM_USERNAME="your-username"
CRM_PASSWORD="your-password"

# ============================================
# Finance System (Siagh)
# ============================================
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
# Password MUST be MD5 hashed!
# Run: npm run hash-password your-password
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"

# ============================================
# Sync Settings
# ============================================
POLL_INTERVAL_SECONDS=300
MAX_RETRY_ATTEMPTS=3
ENABLE_WEBHOOKS=false

# ============================================
# Application
# ============================================
PORT=3000
NODE_ENV=development
```

### Important Notes

**Siagh Finance Password:**
- Must be MD5 hashed in uppercase
- Use: `npm run hash-password your-actual-password`
- Example: `echo -n "your-password" | md5sum | tr '[:lower:]' '[:upper:]'`

**Customer Number:**
- Used as unique identifier to prevent duplicates
- CRM `code` field maps to Siagh `Code` field

**Identity Type Detection:**
- Siagh `tarafType` field: `0` = Person, `1` = Organization
- Used instead of legacy `TowardType` boolean field

**Unique Identifier:**
- Siagh `TmpId` field used for entity mapping
- Stored in CRM's `refId` field for bidirectional linking

---

## Deployment

### Quick Deployment (Linux → Windows)

#### On Linux (Development Machine)

```bash
# 1. Build deployment package
./scripts/build-for-production.sh

# 2. Transfer to Windows server
# Option A: Copy folder
scp -r deployment/ user@windows-server:/C:/SiaghSync/

# Option B: Transfer archive
scp siaghsync-deployment-*.tar.gz user@windows-server:/C:/SiaghSync/
```

#### On Windows Server

```powershell
# 1. Extract (if using archive)
tar -xzf siaghsync-deployment-*.tar.gz

# 2. Run deployment script (as Administrator)
# Right-click PowerShell -> Run as Administrator
.\deploy-windows.ps1

# 3. Edit .env with your credentials
notepad .env

# 4. Run database migrations
npx prisma migrate deploy

# 5. Run initial import (one-time)
npm run initial-import

# 6. Start application
node dist/main.js
# Or use PM2 (recommended):
pm2 start dist/main.js --name siaghsync
pm2 save
```

### Windows Prerequisites

1. **Node.js 18+**: https://nodejs.org/
2. **PostgreSQL**: https://www.postgresql.org/download/windows/ (or use cloud)
3. **Redis**: https://github.com/microsoftarchive/redis/releases (or use cloud)

### Running as Windows Service (PM2)

```powershell
# Install PM2 globally
npm install -g pm2 pm2-windows-service

# Install PM2 as Windows Service
pm2-service-install

# Start application
pm2 start dist/main.js --name siaghsync

# Save configuration
pm2 save

# Monitor
pm2 logs siaghsync
pm2 monit

# Restart
pm2 restart siaghsync
```

---

## Usage

### Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run build              # Build TypeScript
npm run start:prod         # Start production build

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open database GUI

# Sync Operations
npm run initial-import     # One-time import from Finance to CRM
npm run check-apis         # Test API connectivity
npm run check-db           # Check database connection and stats

# Utilities
npm run hash-password      # Generate MD5 hash for Siagh password
npm run view-webhooks      # View recent webhook logs
npm run view-failed        # View failed syncs

# Testing
npm run test               # Run tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report

# Code Quality
npm run lint               # Lint code
npm run format             # Format code
```

### Webhook Endpoints

Register these URLs in your CRM:

- **Identity Changes**: `http://your-server:3000/webhook/crm/identity`
- **Invoice Changes**: `http://your-server:3000/webhook/crm/invoice`
- **Test Endpoint**: `http://your-server:3000/webhook/crm/test`
- **Health Check**: `http://your-server:3000/health`

### Initial Setup Workflow

1. **Configure .env** with all credentials
2. **Hash Siagh password**: `npm run hash-password`
3. **Test connectivity**: `npm run check-apis`
4. **Run initial import**: `npm run initial-import`
5. **Register webhooks** in CRM (or use polling)
6. **Start application**: `npm run start:dev` or `pm2 start`
7. **Monitor logs**: Check console or `pm2 logs siaghsync`

---

## Monitoring & Logs

### Quick Log Commands

```powershell
# Check database status and recent activity
npm run check-db

# View database in GUI
npx prisma studio

# View application logs (with PM2)
pm2 logs siaghsync

# View recent webhook events
npm run view-webhooks

# View failed syncs
npm run view-failed
```

### Database Monitoring (Prisma Studio)

```powershell
# Launch database browser
npx prisma studio
# Opens at http://localhost:5555
```

**Key Tables:**
- **SyncLog**: All sync operations (filter by `triggerType = "WEBHOOK"`)
- **EntityMapping**: CRM ID ↔ Finance ID mappings
- **WebhookSubscription**: Registered webhooks

### Application Logs

**With PM2:**
```powershell
# Real-time logs
pm2 logs siaghsync

# Last 100 lines
pm2 logs siaghsync --lines 100

# Filter for webhooks
pm2 logs siaghsync | Select-String "WEBHOOK"

# Save to file
pm2 logs siaghsync --lines 1000 > logs.txt
```

**Direct console** (if not using PM2):
- Logs appear in terminal where app started
- Look for detailed sync operation logs

### Webhook Logs

View webhook activity:

```powershell
# View recent webhooks
npm run view-webhooks

# View more (e.g., 50 webhooks)
npm run view-webhooks --count 50

# View only failed
npm run view-failed

# View by entity type
npm run view-webhooks --type CUSTOMER
```

**Example output:**
```
✅ Webhook Event
   ID: abc-123-def
   Status: SUCCESS
   Direction: CRM → FINANCE
   Entity Type: CUSTOMER
   Source ID: crm-12345
   Target ID: fin-67890
   Duration: 1234ms
   📦 Webhook Payload: {...}
```

### Database Queries

**Recent sync activity:**
```sql
SELECT
  id,
  status,
  "triggerType",
  "sourceEntityId",
  "startedAt",
  "durationMs",
  "errorMessage"
FROM "SyncLog"
WHERE "triggerType" = 'WEBHOOK'
ORDER BY "startedAt" DESC
LIMIT 20;
```

**Failed syncs (last 24h):**
```sql
SELECT
  status,
  "errorMessage",
  COUNT(*) as count
FROM "SyncLog"
WHERE status = 'FAILED'
  AND "startedAt" > NOW() - INTERVAL '24 hours'
GROUP BY status, "errorMessage"
ORDER BY count DESC;
```

**Sync performance:**
```sql
SELECT
  "triggerType",
  status,
  COUNT(*) as total,
  AVG("durationMs") as avg_duration_ms,
  MAX("durationMs") as max_duration_ms
FROM "SyncLog"
WHERE "startedAt" > NOW() - INTERVAL '7 days'
GROUP BY "triggerType", status
ORDER BY total DESC;
```

### Health Check

```powershell
# Test application health
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"...","service":"SiaghSync"}
```

---

## Troubleshooting

### Application Won't Start

**Check Node.js version:**
```powershell
node --version  # Should be 18+
```

**Reinstall dependencies:**
```powershell
npm ci --production
npx prisma generate
```

**Verify .env file:**
```powershell
# Check all required variables are set
cat .env  # Linux
Get-Content .env  # Windows
```

**Check logs:**
```powershell
pm2 logs siaghsync --lines 100
```

### Database Connection Issues

**Verify PostgreSQL is running:**
```powershell
# Linux
sudo systemctl status postgresql

# Windows
Get-Service postgresql*
```

**Test connection:**
```powershell
psql -U siagh_user -d siagh_sync -h localhost
```

**Check DATABASE_URL** in .env matches your setup

**Run migrations:**
```powershell
npx prisma migrate deploy
```

### Redis Connection Issues

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

**Check port availability:**
```powershell
# Windows
netstat -an | findstr 6379

# Linux
netstat -tuln | grep 6379
```

**Alternative**: Use cloud Redis and update REDIS_HOST in .env

### Authentication Issues

**CRM authentication fails:**
1. Verify CRM_USERNAME and CRM_PASSWORD in .env
2. Check for "Too many attempts" - wait 15-30 minutes
3. Test manually: `npm run check-apis`

**Siagh authentication fails:**
1. **Verify password is MD5 hashed**: `npm run hash-password your-password`
2. Copy hash to FINANCE_PASSWORD in .env (uppercase!)
3. Test: `npm run check-apis`

### No Syncs Happening

1. **Check initial import completed**: `npm run check-db`
2. **Verify entity mappings exist**: Open Prisma Studio → EntityMapping table
3. **Check webhook registration** in CRM settings
4. **Enable polling** if webhooks unavailable: `ENABLE_WEBHOOKS=false` in .env
5. **Review logs**: `pm2 logs siaghsync`

### Duplicate Customers Created

1. **Verify customer number is set** in both CRM and Finance
2. **Check entity mappings**: `npx prisma studio` → EntityMapping
3. **Re-run initial import** to link existing: `npm run initial-import`

### Port Already in Use

```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Permission Issues (Windows)

1. **Run PowerShell as Administrator**
   - Right-click PowerShell
   - Select "Run as Administrator"

2. **Enable script execution:**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Slow Performance

**Check database indexes:**
```sql
SELECT * FROM pg_indexes WHERE tablename = 'EntityMapping';
```

**Check Redis latency:**
```bash
redis-cli --latency
```

**Reduce polling frequency:**
```bash
# In .env
POLL_INTERVAL_SECONDS=600  # 10 minutes
```

---

## API Reference

### Siagh Finance API

**Base URL**: Configured in FINANCE_API_BASE_URL (e.g., `http://172.16.16.15`)

**Authentication:**
- Endpoint: `POST /GeneralApi/LoginUser`
- Username: Persian text (e.g., "مدیر سیستم")
- Password: MD5 hash (uppercase)
- Returns: `SessionId` used in subsequent requests

**Key Endpoints:**
- `POST /GeneralApi/LoginUser` - Login
- `POST /GeneralApi/SaveFormData` - Create/update entities
- `POST /GeneralApi/GetAllUsers` - Get all contacts
- Form IDs:
  - Identity (Contact): `2BFDA`
  - Pre-Invoice: `43D81`

### CRM API

**Base URL**: `https://crm.payamgostar.com`

**Authentication:**
- Endpoint: `POST /api/v2/auth/login`
- Returns: `accessToken` for Bearer authentication

**Webhook Events:**
- `identity.created`
- `identity.updated`
- `invoice.created`
- `invoice.updated`

---

## Additional Resources

### Database Management

- **Prisma Studio**: `npm run prisma:studio` → http://localhost:5050
- **pgAdmin**: http://localhost:5050 (if using Docker Compose)

### Backup

```powershell
# Backup database
pg_dump -U siagh_user siagh_sync > backup.sql

# Backup .env
copy .env .env.backup
```

### Updates

```bash
# On Linux (development)
./scripts/build-for-production.sh

# Transfer to Windows

# On Windows (production)
pm2 stop siaghsync
# Extract new deployment
npm ci --production
npx prisma generate
npx prisma migrate deploy
pm2 restart siaghsync
```

---

## Security Checklist

- [ ] Change default database passwords
- [ ] Use strong passwords for CRM and Finance APIs
- [ ] Enable Windows Firewall / Linux firewall
- [ ] Use HTTPS for webhooks (if exposed to internet)
- [ ] Restrict database access to localhost or private network
- [ ] Never commit .env file to version control
- [ ] Regular backups of database
- [ ] Update Node.js and dependencies regularly
- [ ] Monitor logs for suspicious activity

---

## Summary

**What SiaghSync Does:**
1. Imports existing customers from Finance (Siagh) to CRM (one-time)
2. Continuously syncs CRM changes to Finance (webhooks or polling)
3. Prevents duplicates using customer number matching
4. Handles conflicts by prioritizing CRM data
5. Provides comprehensive logging and monitoring

**Key Points:**
- CRM is the source of truth for ongoing operations
- Finance system follows CRM updates
- Customer number prevents duplicates
- All operations are idempotent and logged
- Supports both webhook (real-time) and polling modes

**Ready to Sync!** 🚀

For more details, see the source code documentation and inline comments.
