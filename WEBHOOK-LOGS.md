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


this is the http://172.16.16.16/api/v2/crmobject/quote/sales/get
api to use for getting the qoute info so we can map it to siagh and add qoute to siagh  an this is the response we get from it {
    "priceListName": "",
    "discount": 0.00,
    "vat": 9000.00,
    "toll": 0.00,
    "additionalCosts": null,
    "totalValue": 100000.00,
    "quoteDate": null,
    "expireDate": null,
    "vatPercent": 9,
    "tollPercent": 0,
    "quoteType": "Quote",
    "details": [
        {
            "productCode": "Product-1",
            "productId": "46da9490-ee92-42df-ba61-64d62b4da6b9",
            "productName": "محصول اول",
            "isService": false,
            "baseUnitPrice": 100000.00,
            "finalUnitPrice": 109000.00,
            "count": 1.0000,
            "returnedCount": 0.0,
            "totalUnitPrice": 100000.00,
            "totalDiscount": 0.00,
            "totalVat": 9000.00,
            "totalToll": 0.00,
            "discountPercent": 0.0,
            "detailDescription": "",
            "productUnitTypeName": "قطعه",
            "serial": null
        }
    ],
    "discountPercent": 0.00,
    "totalDiscountPercent": 0.0,
    "finalValue": 109000.00,
    "number": "",
    "billableObjectState": null,
    "billableObjectStateIndex": 1,
    "crmId": "265d2327-64bd-4ac5-9fb9-22ae0e838539",
    "crmObjectTypeIndexPreview": null,
    "crmObjectTypeIndex": 8,
    "crmObjectTypeName": null,
    "crmObjectTypeId": "bbd30af5-19f5-4bbb-9410-f44916f68d74",
    "crmObjectTypeCode": "PI_5",
    "parentCrmObjectId": null,
    "extendedProperties": [],
    "creatDate": "2025-12-21T14:06:17.173",
    "modifyDate": "2025-12-21T14:10:20.033",
    "tags": [],
    "refId": "",
    "stageId": null,
    "identityIdPreview": null,
    "identityId": "8adeeabc-fab9-4a77-a906-e47ac59373a7",
    "description": "",
    "subject": "Test Organization 1766067758042(مشتری) - 100-965815809(پیش فاکتور فروش)",
    "processLifePaths": [],
    "color": null,
    "modifierIdPreview": null,
    "modifierId": "4233cbee-9ab3-4a43-be99-b5e76c6d098e",
    "creatorIdPreview": null,
    "creatorId": "4233cbee-9ab3-4a43-be99-b5e76c6d098e",
    "assignedToIdPreview": null,
    "assignedToId": "4233cbee-9ab3-4a43-be99-b5e76c6d098e"
}
?

and this is the request body {
 "id":"265d2327-64bd-4ac5-9fb9-22ae0e838539"
}

730679330: crm-quote-webhook
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SyncJobProcessor] ═══════════════════════════════════════════════════════════════
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SyncJobProcessor] 📥 Processing CRM Quote Webhook
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SyncJobProcessor] ═══════════════════════════════════════════════════════════════
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SyncJobProcessor]    Event ID: 1766730679330
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SyncJobProcessor]    Action: Update
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SyncJobProcessor]    Quote ID: 880d8361-7560-45b7-9670-79d91257f59a
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SyncJobProcessor]    Subtype: پیش فاکتور غیررسمی
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SyncJobProcessor]    Timestamp: 2025-12-26T06:31:19.332Z
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SyncJobProcessor]
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService] ═══════════════════════════════════════════════════════════════
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService] 🔄 SYNCING QUOTE: CRM → Siagh
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService] ═══════════════════════════════════════════════════════════════
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    Quote ID: 880d8361-7560-45b7-9670-79d91257f59a
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    Transaction ID: f04241c4-9cf1-41ab-8d7f-2a9e000eb8be
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService] 📥 Step 1: Fetching quote from CRM...
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmApiClient] Fetching quote: 880d8361-7560-45b7-9670-79d91257f59a
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM   DEBUG [CrmApiClient] POST http://172.16.16.16/api/v2/crmobject/quote/sales/get
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    ✅ Retrieved quote: 1
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService] 🔍 Step 2: Extracting sale model code...
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM    WARN [CrmQuoteToSiaghService] ⚠️ Could not extract sale model code from "Productinvoice", using default "1"
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    CRM Object Type Code: Productinvoice
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    ✅ Extracted Sale Model Code: 1
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService] 📥 Step 3: Finding customer mapping...
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    ✅ Customer Code in Siagh: 8388
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService] 🔄 Step 4: Transforming to Siagh pre-invoice format...
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    Customer Code: 8388
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    Sale Model Code: 1
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    Items: 1
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]    Total: 100000
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService]
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [CrmQuoteToSiaghService] 📝 Step 5: Creating pre-invoice in Siagh...
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM     LOG [SiaghApiClient] ➕ Creating pre-invoice in Siagh for customer: 8388
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM   DEBUG [SiaghApiClient]    Request: {
0|siaghsync  |   "formId": "43D81",
0|siaghsync  |   "ctrlValues": "sl_sanad.hssanadstate=8|sl_sanad.codenoeesanad=2|sl_sanad.codesalemodel=1|sl_sanad.salmali=1404|sl_sanad.codenoeepardakht=2|sl_sanad.codemarkazforush=|sl_sanad.codecontact=|sl_sanad.codemoshtari=8388|sl_sanad.codenoeeforush=1|sl_sanad.codevaseteh=|sl_sanad.tozihat=Test Organization 1766067758042(مشتری) - 100-965815809(پیش فاکتور فروش)|sl_sanad.namenoesanad=پیش فاکتور فروش Productinvoice",
0|siaghsync  |   "parameters": "_In_EditKeys=|_In_Suid=CD2E242D-2AC1-4786-B35D-FE927F2BCA7E|nocheck=",
0|siaghsync  |   "dataRows": "[{\"name\":\"dbgrid1\",\"entity\":\"sl_rizsanad\",\"keyField\":\"coderiz\",\"data\":[{\"__uid\":{\"oldValue\":\"item-0\",\"newValue\":\"item-0\"},\"_status\":{\"oldValue\":\"inserted\",\"newValue\":\"inserted\"},\"codekala\":{\"oldValue\":null,\"newValue\":\"Product-1\"},\"nameunit\":{\"oldValue\":null,\"newValue\":\"قطعه\"},\"qty\":{\"oldValue\":null,\"newValue\":1},\"mabtakhfif\":{\"oldValue\":null,\"newValue\":0},\"vazn\":{\"oldValue\":null,\"newValue\":\"0\"},\"hajm\":{\"oldValue\":null,\"newValue\":\"0\"},\"price\":{\"oldValue\":null,\"newValue\":100000},\"radif\":{\"oldValue\":null,\"newValue\":\"1\"},\"finalqty\":{\"oldValue\":null,\"newValue\":1},\"takhfif\":{\"oldValue\":null,\"newValue\":null},\"sumamelinc\":{\"oldValue\":null,\"newValue\":null},\"sumameldec\":{\"oldValue\":null,\"newValue\":null}}]}]",
0|siaghsync  |   "attachments": "[]",
0|siaghsync  |   "postCode": "1110",
0|siaghsync  |   "flowId": ""
0|siaghsync  | }
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:46 AM   DEBUG [SiaghApiClient] 📤 Siagh Request: POST /BpmsApi/SaveFormData
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   DEBUG [SiaghApiClient] 📥 Siagh Response: 200 /BpmsApi/SaveFormData
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   ERROR [SiaghApiClient] ❌ Failed to create pre-invoice:  پیامهای سرویس : RUNTIME ERROR
0|siaghsync  | Field 'Code' not found when evaluating instruction CallProc ($FFFFFFFF,$1,$1E888D0,$0,'FieldByName').
0|siaghsync  | Stack content is: [Null,Null,0,97227280...].
0|siaghsync  | Source position: 218,84
0|siaghsync  | Position: 218, 84
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   ERROR [CrmQuoteToSiaghService] ═══════════════════════════════════════════════════════════════
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   ERROR [CrmQuoteToSiaghService] ❌ SYNC FAILED
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   ERROR [CrmQuoteToSiaghService] ═══════════════════════════════════════════════════════════════
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   ERROR [CrmQuoteToSiaghService]    Error: Siagh API error:  پیامهای سرویس : RUNTIME ERROR
0|siaghsync  | Field 'Code' not found when evaluating instruction CallProc ($FFFFFFFF,$1,$1E888D0,$0,'FieldByName').
0|siaghsync  | Stack content is: [Null,Null,0,97227280...].
0|siaghsync  | Source position: 218,84
0|siaghsync  | Position: 218, 84
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   ERROR [CrmQuoteToSiaghService]
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   ERROR [SyncJobProcessor] ❌ Failed to sync quote: Siagh API error:  پیامهای سرویس : RUNTIME ERROR
0|siaghsync  | Field 'Code' not found when evaluating instruction CallProc ($FFFFFFFF,$1,$1E888D0,$0,'FieldByName').
0|siaghsync  | Stack content is: [Null,Null,0,97227280...].
0|siaghsync  | Source position: 218,84
0|siaghsync  | Position: 218, 84
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   ERROR [SyncJobProcessor] Job crm-quote-880d8361-7560-45b7-9670-79d91257f59a-1766730679330 failed: Siagh API error:  پیامهای سرویس : RUNTIME ERROR
0|siaghsync  | Field 'Code' not found when evaluating instruction CallProc ($FFFFFFFF,$1,$1E888D0,$0,'FieldByName').
0|siaghsync  | Stack content is: [Null,Null,0,97227280...].
0|siaghsync  | Source position: 218,84
0|siaghsync  | Position: 218, 84
0|siaghsync  | Error: Siagh API error:  پیامهای سرویس : RUNTIME ERROR
0|siaghsync  | Field 'Code' not found when evaluating instruction CallProc ($FFFFFFFF,$1,$1E888D0,$0,'FieldByName').
0|siaghsync  | Stack content is: [Null,Null,0,97227280...].
0|siaghsync  | Source position: 218,84
0|siaghsync  | Position: 218, 84
0|siaghsync  |     at SiaghApiClient.createPreInvoice (C:\Users\adminapp\SyncSiagh\deployment\src\finance\siagh-api.client.ts:424:13)
0|siaghsync  |     at processTicksAndRejections (node:internal/process/task_queues:103:5)
0|siaghsync  |     at CrmQuoteToSiaghService.syncQuote (C:\Users\adminapp\SyncSiagh\deployment\src\sync\orchestrator\crm-quote-to-siagh.service.ts:124:34)
0|siaghsync  |     at SyncJobProcessor.processCrmQuoteWebhook (C:\Users\adminapp\SyncSiagh\deployment\src\sync\jobs\sync-job.processor.ts:180:7)
0|siaghsync  |     at SyncJobProcessor.process (C:\Users\adminapp\SyncSiagh\deployment\src\sync\jobs\sync-job.processor.ts:60:18)
0|siaghsync  |     at C:\Users\adminapp\SyncSiagh\deployment\node_modules\bullmq\src\classes\worker.ts:990:26
0|siaghsync  | [Nest] 12268  - 12/26/2025, 10:01:48 AM   ERROR [SyncJobProcessor] ❌ Job crm-quote-880d8361-7560-45b7-9670-79d91257f59a-1766730679330 failed: Siagh API error:  پیامهای سرویس : RUNTIME ERROR
0|siaghsync  | Field 'Code' not found when evaluating instruction CallProc ($FFFFFFFF,$1,$1E888D0,$0,'FieldByName').
0|siaghsync  | Stack content is: [Null,Null,0,97227280...].
0|siaghsync  | Source position: 218,84
0|siaghsync  | Position: 218, 84


if there was no related filed for code vaseteh in crm use 31 s deaflut and add the log for it 
sl_sanad.codemarkazforush use the number after PI_5 from crm we are getting