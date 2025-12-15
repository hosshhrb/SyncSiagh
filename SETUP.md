# SiaghSync Setup Guide

This guide will help you set up and run the two-way sync engine.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:

**Required:**
- `CRM_API_TOKEN`: Your Payamgostar CRM API token
- `FINANCE_API_BASE_URL`: Your Finance system base URL
- `FINANCE_USERNAME`: Finance system username
- `FINANCE_PASSWORD`: Finance system password

**Optional:**
- `WEBHOOK_SECRET`: Generate a secure random string for webhook validation
- `POLL_INTERVAL_SECONDS`: How often to poll for changes (default: 300 = 5 minutes)
- `ENABLE_WEBHOOKS`: Set to `true` if using webhooks instead of polling

### 3. Start Infrastructure

Start PostgreSQL, Redis, and pgAdmin:

```bash
docker-compose up -d
```

Verify services are running:
```bash
docker-compose ps
```

You should see:
- `siagh_sync_postgres` (port 5432)
- `siagh_sync_redis` (port 6379)
- `siagh_sync_pgadmin` (port 5050)

### 4. Initialize Database

Generate Prisma client:
```bash
npm run prisma:generate
```

Run database migrations:
```bash
npm run prisma:migrate
```

This creates the database schema with tables:
- `EntityMapping` - Links entities between CRM and Finance
- `SyncLog` - Comprehensive audit log of all sync operations
- `WebhookSubscription` - Tracks webhook registrations
- `SyncRetryQueue` - Failed syncs awaiting retry

### 5. Verify Database

Open Prisma Studio to inspect the database:
```bash
npm run prisma:studio
```

Or use pgAdmin at http://localhost:5050:
- Email: `admin@siagh.local`
- Password: `admin`

Add server connection:
- Host: `postgres`
- Port: `5432`
- Database: `siagh_sync`
- Username: `siagh_user`
- Password: `siagh_pass`

### 6. Start Application

Development mode with hot reload:
```bash
npm run start:dev
```

The application will start on http://localhost:3000

Check health:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "service": "SiaghSync"
}
```

## Testing the Sync

### Test CRM Connection

The application will attempt to connect to CRM on startup. Check logs for:
```
✅ Database connected
✅ CRM token validated successfully
```

If you see errors, verify your `CRM_API_TOKEN` and `CRM_API_BASE_URL`.

### Test Finance Connection

The application will authenticate with Finance on first API call. Check logs for:
```
✅ Successfully authenticated with Finance API
```

### Monitor Sync Operations

1. **Watch Application Logs:**
   ```bash
   npm run start:dev
   ```

2. **View Sync Logs in Database:**
   - Open Prisma Studio: `npm run prisma:studio`
   - Navigate to `SyncLog` table
   - See real-time sync operations with full audit trail

3. **Monitor Queue:**
   The application logs queue statistics every hour:
   ```
   📊 Sync Queue Stats - Waiting: 0, Active: 1, Completed: 45, Failed: 0
   ```

## Sync Modes

### Polling Mode (Default)

The application polls CRM and Finance every 5 minutes for changes:

```
🔄 Polling CRM for customer changes...
Found 3 updated customers in CRM
✅ Queued 3 customers for sync
```

### Webhook Mode (Recommended for Production)

1. Set `ENABLE_WEBHOOKS=true` in `.env`

2. Register webhook with CRM:
   ```bash
   POST https://crm.payamgostar.com/api/webhooks
   {
     "url": "https://your-domain.com/webhook/crm",
     "events": ["customer.created", "customer.updated", "invoice.created", "invoice.updated"]
   }
   ```

3. Webhook endpoint will process events asynchronously:
   ```
   📨 Received CRM webhook: customer.updated - CUSTOMER
   ✅ Webhook queued for processing
   ```

## Architecture Overview

```
CRM System ──┐
             ├──> Sync Engine ──> PostgreSQL (State & Logs)
Finance ─────┘         │
                       └──> Redis (Job Queue)
```

**Key Features:**
- ✅ Two-way sync (CRM ↔ Finance)
- ✅ Conflict resolution (last-write-wins)
- ✅ Loop prevention (intelligent deduplication)
- ✅ Idempotency (safe retries)
- ✅ Comprehensive audit trail
- ✅ Background job processing
- ✅ Automatic retry on failures

## Troubleshooting

### Database Connection Issues

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec -it siagh_sync_postgres psql -U siagh_user -d siagh_sync
```

### Redis Connection Issues

```bash
# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis

# Test connection
docker exec -it siagh_sync_redis redis-cli ping
```

### Sync Failures

Check `SyncLog` table for error details:
```sql
SELECT * FROM "SyncLog" 
WHERE status = 'FAILED' 
ORDER BY "startedAt" DESC 
LIMIT 10;
```

Failed syncs are automatically retried up to `MAX_RETRY_ATTEMPTS` times.

### Clear Job Queue

If the queue gets stuck:
```bash
docker exec -it siagh_sync_redis redis-cli FLUSHALL
```

Then restart the application.

## Production Deployment

### Environment Variables

Ensure all production values are set:
- Use secure `WEBHOOK_SECRET`
- Set `NODE_ENV=production`
- Use production database URL
- Configure proper logging

### Scaling

- Increase `concurrency` in `SyncJobProcessor` for more parallel processing
- Run multiple instances behind a load balancer
- Use Redis cluster for high availability

### Monitoring

- Monitor `SyncLog` table for failures
- Set up alerts for failed syncs
- Track queue depth (waiting + active jobs)
- Monitor API latency to CRM and Finance

### Security

- Use HTTPS for webhook endpoints
- Rotate `WEBHOOK_SECRET` regularly
- Store credentials in secure vault (not .env)
- Enable rate limiting on webhook endpoints

## Next Steps

1. ✅ Verify CRM and Finance connectivity
2. ✅ Test customer sync (create/update in CRM, verify in Finance)
3. ✅ Test reverse sync (update in Finance, verify in CRM)
4. ✅ Monitor sync logs for any issues
5. 🔜 Add PreInvoice entity sync
6. 🔜 Implement retry mechanism UI
7. 🔜 Add admin dashboard

## Support

For issues or questions, check:
- Application logs: `npm run start:dev`
- Database logs: `npm run prisma:studio`
- Docker logs: `docker-compose logs -f`

