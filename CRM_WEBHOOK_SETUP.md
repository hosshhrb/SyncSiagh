# CRM Webhook Setup Guide

How to register webhook endpoints in CRM (Payamgostar) so it notifies us of changes.

---

## 📡 Webhook Endpoints

Register these URLs in your CRM settings:

### 1. Identity Changes (Person/Organization)

**URL:** `http://your-server:3000/webhook/crm/identity`

**When CRM should call:**
- New person created
- Person updated
- New organization created
- Organization updated

### 2. Invoice Changes

**URL:** `http://your-server:3000/webhook/crm/invoice`

**When CRM should call:**
- New invoice created
- Invoice updated
- Invoice status changed

### 3. Test Endpoint (for debugging)

**URL:** `http://your-server:3000/webhook/crm/test`

**Use this first** to see what data CRM sends!

---

## 🔧 How to Register in CRM

### Step 1: Find Webhook Settings in CRM

Look for:
- Settings → Webhooks
- Settings → Integrations
- Settings → API
- Admin → Webhooks

### Step 2: Add Webhook URL

For each event type, register:

**Identity Webhook:**
```
URL: http://your-server-ip:3000/webhook/crm/identity
Method: POST
Content-Type: application/json
Events: identity.created, identity.updated
```

**Invoice Webhook:**
```
URL: http://your-server-ip:3000/webhook/crm/invoice
Method: POST
Content-Type: application/json
Events: invoice.created, invoice.updated
```

---

## 🧪 Testing Webhooks

### Test with curl (from any machine)

**Test endpoint:**
```bash
curl -X POST http://your-server:3000/webhook/crm/test \
  -H "Content-Type: application/json" \
  -d '{
    "identityId": "test-123",
    "action": "created",
    "identityType": "Person",
    "data": {
      "nickName": "Test Person",
      "customerNo": "CUST001"
    }
  }'
```

**Check application logs** - you'll see:
```
📨 ================== CRM TEST WEBHOOK RECEIVED ==================
   Event ID: 1702891234567
   Timestamp: 2024-12-15T...
📋 All Headers:
{
  "content-type": "application/json",
  "user-agent": "curl/7.68.0",
  ...
}
📦 Full Payload:
{
  "identityId": "test-123",
  "action": "created",
  ...
}
====================================================================
```

### Test Identity Webhook

```bash
curl -X POST http://your-server:3000/webhook/crm/identity \
  -H "Content-Type: application/json" \
  -d '{
    "identityId": "real-identity-id-here",
    "action": "created",
    "identityType": "Person"
  }'
```

---

## 📊 What Happens When Webhook is Received

1. **Webhook received** → Logged with full headers and payload
2. **Job queued** → Added to BullMQ for async processing
3. **Immediate response** → CRM gets 200 OK
4. **Background processing:**
   - Fetches full identity from CRM
   - Logs the CRM data structure
   - Transforms to Finance format
   - Logs the Finance data
   - Creates/updates in Finance
   - Updates entity mapping
   - Logs success/failure

---

## 📋 Viewing Webhook Logs

### Real-Time Console Logs

When running:
```powershell
node dist/main.js
```

You'll see detailed logs for every webhook:
```
📨 ================== CRM IDENTITY WEBHOOK RECEIVED ==================
   Event ID: 1702891234567
📋 Headers: { ... }
📦 Payload: { ... }
========================================================================
🔄 ================== SYNCING IDENTITY TO FINANCE ==================
   Identity ID: abc-123
📋 CRM Identity Data: { ... }
📋 Finance Data to Send: { ... }
✅ Created Finance customer xyz-789
========================================================================
```

### Database Logs

```powershell
npm run prisma:studio
```

Navigate to **SyncLog** table:
- See all webhook events
- View full payloads
- Check success/failure
- See error messages

---

## 🔍 Debugging Webhook Data Structure

### Step 1: Use Test Endpoint First

Send a test webhook to `/webhook/crm/test` to see what CRM sends.

### Step 2: Check Logs

Application logs show:
- All headers CRM sends
- Complete payload structure
- Data types and formats

### Step 3: Adjust Mapping

Based on logs, adjust the data transformation in:
- `src/sync/orchestrator/identity-to-finance.service.ts`
- `transformCrmToFinance()` method

---

## 📝 Expected Webhook Payload from CRM

Based on CRM documentation, CRM might send:

**For Identity:**
```json
{
  "eventType": "identity.created",
  "eventId": "unique-event-id",
  "timestamp": "2024-12-15T12:00:00Z",
  "data": {
    "identityId": "abc-123",
    "identityType": "Person",
    "nickName": "John Doe",
    "customerNumber": "CUST001"
  }
}
```

**For Invoice:**
```json
{
  "eventType": "invoice.created",
  "eventId": "unique-event-id",
  "timestamp": "2024-12-15T12:00:00Z",
  "data": {
    "invoiceId": "inv-123",
    "customerIdentityId": "abc-123",
    "amount": 5000000,
    "status": "Draft"
  }
}
```

**But we log everything to see the actual structure!**

---

## 🔐 Security (Optional)

If CRM supports webhook signatures, add validation in `.env`:

```bash
WEBHOOK_SECRET="your-secret-key"
```

The webhook validator will check HMAC signatures.

---

## 🎯 Registration Checklist

- [ ] Application running on server
- [ ] Port 3000 accessible from CRM server
- [ ] Webhook URLs registered in CRM:
  - [ ] `http://your-server:3000/webhook/crm/identity`
  - [ ] `http://your-server:3000/webhook/crm/invoice`
- [ ] Test webhook sent and logged
- [ ] Real webhook received and processed
- [ ] Check SyncLog table for entries

---

## 📚 Related Files

- `src/sync/webhook/crm-webhook.controller.ts` - Webhook endpoints
- `src/sync/orchestrator/identity-to-finance.service.ts` - Sync logic
- `src/sync/jobs/sync-job.processor.ts` - Background processing

---

## 🆘 Troubleshooting

**Webhook not received?**
- Check firewall allows incoming connections on port 3000
- Verify URL is correct in CRM settings
- Check application is running: `curl http://localhost:3000/health`

**Webhook received but not processing?**
- Check application logs for errors
- Check SyncLog table in database
- Verify job queue is running (Redis must be up)

**Wrong data structure?**
- Check application logs - full payload is logged
- Adjust transformation logic based on actual structure
- Update DTOs if needed

---

**Test first with `/webhook/crm/test` to see what CRM sends!** 🚀

