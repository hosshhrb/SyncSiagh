# How to Check Webhook Logs

Your SiaghSync application logs all webhook events comprehensively. Here's how to view them.

## 📍 Webhook Endpoints

Your application has these webhook endpoints:

### CRM Webhooks:
- **Identity Changes**: `http://your-server:3000/webhook/crm/identity`
- **Invoice Changes**: `http://your-server:3000/webhook/crm/invoice`
- **Test Endpoint**: `http://your-server:3000/webhook/crm/test`

### Generic Webhooks:
- **CRM Webhook**: `http://your-server:3000/webhook/crm`
- **Finance Webhook**: `http://your-server:3000/webhook/finance`

## 🔍 How to View Webhook Logs

### Method 1: Application Logs (Real-Time)

When a webhook is received, it's logged immediately to the console:

**On Windows:**
```powershell
# If running with PM2
pm2 logs siaghsync

# Filter for webhook logs only
pm2 logs siaghsync | Select-String "WEBHOOK"

# Or if running in console
# Logs appear in the terminal where you started the app
```

**On Linux:**
```bash
# If running with PM2
pm2 logs siaghsync

# Filter for webhook logs
pm2 logs siaghsync | grep "WEBHOOK"
```

#### What You'll See:
```
📨 ================== CRM IDENTITY WEBHOOK RECEIVED ==================
   Event ID: 1702834567890
   Timestamp: 2024-12-17T10:15:45.123Z
📋 Headers:
   content-type: application/json
   user-agent: CRM-Webhook/1.0
📦 Payload:
{
  "identityId": "12345",
  "action": "update",
  "identityType": "Person"
}
========================================================================
✅ Webhook queued for processing: 1702834567890
```

### Method 2: Database Query (Historical)

View webhook logs stored in the database:

```powershell
# View recent webhooks
npx ts-node scripts/view-webhook-logs.ts

# View more webhooks
npx ts-node scripts/view-webhook-logs.ts --count 50

# View only failed webhooks
npx ts-node scripts/view-webhook-logs.ts --failed

# View pending webhooks
npx ts-node scripts/view-webhook-logs.ts --pending

# Filter by entity type
npx ts-node scripts/view-webhook-logs.ts --type CUSTOMER
```

#### Example Output:
```
🔍 Fetching webhook logs...

Found 10 webhook events:

═══════════════════════════════════════════════════════════════

✅ Webhook Event
   ID: abc-123-def
   Transaction: trans-456
   Status: SUCCESS
   Direction: CRM → FINANCE
   Entity Type: CUSTOMER
   Source ID: crm-12345
   Target ID: fin-67890
   Received: 12/16/2024, 5:30:45 PM
   Completed: 12/16/2024, 5:30:47 PM
   Duration: 1234ms
   📦 Webhook Payload:
      {
        "eventId": "evt-789",
        "identityId": "12345",
        "action": "update"
      }
──────────────────────────────────────────────────────────────

❌ Webhook Event
   ID: xyz-789-abc
   Status: FAILED
   Direction: CRM → FINANCE
   Entity Type: INVOICE
   Source ID: crm-54321
   Received: 12/16/2024, 5:25:30 PM
   ❌ Error: API connection timeout
   🔄 Retries: 2
──────────────────────────────────────────────────────────────

📊 Summary:
   Total: 10
   ✅ Success: 8
   ❌ Failed: 1
   ⏳ Pending: 1
   🔄 In Progress: 0
   ⏱️  Avg Duration: 987ms
```

### Method 3: Direct Database Query

Using Prisma Studio (GUI):

```powershell
npx prisma studio
```

Then:
1. Open your browser to `http://localhost:5555`
2. Click on **SyncLog** table
3. Filter by `triggerType = "WEBHOOK"`

Using SQL directly:

```sql
-- Recent webhooks
SELECT
  id,
  status,
  "sourceSystem",
  "targetSystem",
  "sourceEntityId",
  "startedAt",
  "completedAt",
  "durationMs",
  "errorMessage"
FROM "SyncLog"
WHERE "triggerType" = 'WEBHOOK'
ORDER BY "startedAt" DESC
LIMIT 20;

-- Failed webhooks
SELECT
  id,
  status,
  "errorMessage",
  "retryCount",
  "triggerPayload",
  "startedAt"
FROM "SyncLog"
WHERE "triggerType" = 'WEBHOOK'
  AND status = 'FAILED'
ORDER BY "startedAt" DESC;

-- Webhook statistics
SELECT
  status,
  COUNT(*) as count,
  AVG("durationMs") as avg_duration_ms
FROM "SyncLog"
WHERE "triggerType" = 'WEBHOOK'
GROUP BY status;
```

## 📊 Understanding Webhook Log Data

Each webhook log contains:

| Field | Description |
|-------|-------------|
| **Event ID** | Unique identifier for this webhook event |
| **Transaction ID** | Groups related sync operations |
| **Status** | PENDING, IN_PROGRESS, SUCCESS, FAILED, CONFLICT |
| **Direction** | CRM_TO_FINANCE or FINANCE_TO_CRM |
| **Entity Type** | CUSTOMER, PREINVOICE, etc. |
| **Source ID** | ID in the source system |
| **Target ID** | ID in the target system (if sync completed) |
| **Received** | When webhook was received |
| **Completed** | When processing finished |
| **Duration** | Processing time in milliseconds |
| **Webhook Payload** | Original data sent by the webhook |
| **Error Message** | If failed, the error details |
| **Retry Count** | Number of retry attempts |

## 🔔 Setting Up Real-Time Monitoring

### Option 1: PM2 Logs (Recommended)

Keep logs visible in a terminal:
```powershell
pm2 logs siaghsync --lines 100
```

### Option 2: Log to File

Configure PM2 to save logs to file:
```powershell
pm2 start dist/src/main.js --name siaghsync --log webhook-logs.log
```

Then monitor the file:
```powershell
Get-Content webhook-logs.log -Wait -Tail 50
```

### Option 3: Create a Monitoring Dashboard

Add this to your `package.json`:
```json
{
  "scripts": {
    "view-webhooks": "ts-node scripts/view-webhook-logs.ts",
    "view-failed": "ts-node scripts/view-webhook-logs.ts --failed",
    "webhook-stats": "ts-node scripts/view-webhook-logs.ts --count 100"
  }
}
```

Then use:
```powershell
npm run view-webhooks
npm run view-failed
```

## 🧪 Testing Webhook Reception

### Test Endpoint

Your app has a test endpoint that logs everything:

```bash
# Test from command line
curl -X POST http://localhost:3000/webhook/crm/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "timestamp": "2024-12-16T12:00:00Z"}'
```

**On Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/webhook/crm/test" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"test": "data", "timestamp": "2024-12-16T12:00:00Z"}'
```

Check the logs immediately to see the full webhook data.

## 🔧 Troubleshooting

### No Webhooks Showing Up

1. **Check if app is running:**
   ```powershell
   pm2 list
   ```

2. **Check if webhook endpoint is accessible:**
   ```powershell
   curl http://localhost:3000/webhook/crm/test
   ```

3. **Check firewall settings** - Ensure port 3000 is open

4. **Verify CRM webhook configuration** - Make sure CRM is sending to correct URL

### Webhooks Failing

1. **View failed webhooks:**
   ```powershell
   npm run view-failed
   ```

2. **Check error messages** in the logs

3. **Common issues:**
   - API authentication failed
   - Network timeout
   - Invalid data format
   - Database connection issue

### View Detailed Error Stack

```sql
SELECT
  "errorMessage",
  "errorStack",
  "triggerPayload"
FROM "SyncLog"
WHERE "triggerType" = 'WEBHOOK'
  AND status = 'FAILED'
ORDER BY "startedAt" DESC
LIMIT 5;
```

## 📈 Performance Monitoring

### Check webhook processing times:

```powershell
# View recent with timing
npx ts-node scripts/view-webhook-logs.ts --count 50
```

Look for:
- **Average duration** should be < 2000ms
- **Failed percentage** should be < 5%
- **Pending webhooks** shouldn't accumulate

### Database Query for Stats:

```sql
-- Webhook performance over last 24 hours
SELECT
  DATE_TRUNC('hour', "startedAt") as hour,
  COUNT(*) as total_webhooks,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as successful,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
  AVG("durationMs") as avg_duration_ms,
  MAX("durationMs") as max_duration_ms
FROM "SyncLog"
WHERE "triggerType" = 'WEBHOOK'
  AND "startedAt" > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

## 🎯 Quick Commands Summary

| Task | Command |
|------|---------|
| View recent webhooks | `npx ts-node scripts/view-webhook-logs.ts` |
| View failed webhooks | `npx ts-node scripts/view-webhook-logs.ts --failed` |
| Real-time logs | `pm2 logs siaghsync` |
| Database GUI | `npx prisma studio` |
| Test webhook | `curl -X POST http://localhost:3000/webhook/crm/test -H "Content-Type: application/json" -d '{}'` |

---

Need more help? Check the application logs with `pm2 logs siaghsync`
