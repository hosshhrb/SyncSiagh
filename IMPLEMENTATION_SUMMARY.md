# Implementation Summary - Updated with Actual APIs

## ✅ What's Implemented

### 1. Initial Import (Finance → CRM)

**Service:** `InitialImportUpdatedService`

**Uses actual CRM APIs:**
- `POST /api/v2/crmobject/identity/getIdentitiesSimple` - Get existing identities from CRM
- `POST /api/v2/crmobject/person/create` - Create person in CRM

**Data Mapping:** Siagh Contact → CRM Person
- `Code` → `customerNumber` (unique key)
- `FullName` → `nickName` + split to `firstName`/`lastName`
- `MobileNo` → `phoneContacts` (Mobile type)
- `TelNo` → `phoneContacts` (Office type)
- `Email` → `email`
- `Address` → `addressContacts`
- `CodeShahr` → `city`
- `CodeOstan` → `state`
- `PoCode` → `zipCode`

**Command:** `npm run initial-import`

---

### 2. CRM Webhook Endpoints (for ongoing sync)

**Controller:** `CrmWebhookController`

#### Endpoint 1: Identity Changes
**URL:** `http://your-server:3000/webhook/crm/identity`

Receives webhooks when:
- Person created/updated
- Organization created/updated

**Logs:**
- Full headers
- Complete payload
- All processing steps

#### Endpoint 2: Invoice Changes
**URL:** `http://your-server:3000/webhook/crm/invoice`

Receives webhooks when:
- Invoice created/updated
- Invoice status changed

**Logs:**
- Full headers
- Complete payload
- All processing steps

#### Endpoint 3: Test Webhook
**URL:** `http://your-server:3000/webhook/crm/test`

**Use this first!** Logs everything to see actual CRM webhook structure.

---

### 3. Identity to Finance Sync

**Service:** `IdentityToFinanceService`

**Process:**
1. Webhook received from CRM
2. Logs full payload and headers
3. Fetches complete identity from CRM using `person/get` or `organization/get`
4. Logs CRM identity data structure
5. Transforms to Finance format
6. Logs Finance data before sending
7. Creates/updates in Finance
8. Updates entity mapping
9. Logs success/failure

**Data Transformation:** CRM Identity → Finance Contact
- `nickName` → `name`
- `customerNumber` → unique key for matching
- `firstName`/`lastName` → `name`
- `phoneContacts` → extract mobile/office phones
- `addressContacts` → extract primary address
- `email` → `email`
- `nationalCode` → `nationalCode`
- `economicCode` → `economicCode`

---

## 📊 Complete Logging

Every webhook and sync operation logs:

### Webhook Logs
```
📨 ================== CRM IDENTITY WEBHOOK RECEIVED ==================
   Event ID: 1702891234567
   Timestamp: 2024-12-15T12:00:00.000Z
📋 Headers:
{
  "content-type": "application/json",
  "user-agent": "CRM-Webhook/1.0",
  ...
}
📦 Payload:
{
  "identityId": "abc-123",
  "action": "created",
  ...
}
========================================================================
```

### Sync Process Logs
```
🔄 ================== SYNCING IDENTITY TO FINANCE ==================
   Identity ID: abc-123
   Identity Type: Person
   Transaction ID: uuid-here
📥 Fetching identity from CRM...
   Person: John Doe
📋 CRM Identity Data:
{
  "nickName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "customerNumber": "CUST001",
  "phoneContacts": [...],
  ...
}
🔄 Transforming to Finance format...
📋 Finance Data to Send:
{
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "mobile": "09123456789",
  ...
}
✅ Created Finance customer xyz-789
========================================================================
```

---

## 🔧 Configuration

Your `.env` now has correct values:

```bash
# CRM (Payamgostar) - Actual API
CRM_API_BASE_URL="http://172.16.16.16"
CRM_USERNAME="webservice"
CRM_PASSWORD="12345678"

# Finance (Siagh) - Actual API
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"
```

---

## 🚀 How to Use

### Step 1: Build and Deploy to Windows

```bash
# On Linux
cd /home/h/SiaghSync
./scripts/build-for-production.sh

# Copy deployment/ to Windows

# On Windows (PowerShell as Admin)
cd C:\SiaghSync
.\deploy-windows.ps1
```

### Step 2: Run Initial Import (One-Time)

```powershell
npm run initial-import
```

Imports all customers from Finance to CRM.

### Step 3: Register Webhooks in CRM

In CRM settings, register:

1. **Identity webhook:**
   - URL: `http://your-server-ip:3000/webhook/crm/identity`
   - Events: identity.created, identity.updated

2. **Invoice webhook:**
   - URL: `http://your-server-ip:3000/webhook/crm/invoice`
   - Events: invoice.created, invoice.updated

3. **Test webhook first:**
   - URL: `http://your-server-ip:3000/webhook/crm/test`
   - Send test event to see logs

### Step 4: Start Application and Monitor Logs

```powershell
node dist/main.js
```

**You'll see:**
- Every webhook received
- Full headers and payload
- Complete sync process
- Success/failure for each operation

---

## 📁 Files Created/Updated

### New Services
- `src/sync/orchestrator/initial-import-updated.service.ts` - Import with actual CRM APIs
- `src/sync/orchestrator/identity-to-finance.service.ts` - Identity sync with detailed logging
- `src/crm/crm-identity-api.client.ts` - CRM Identity/Person/Organization APIs
- `src/sync/webhook/crm-webhook.controller.ts` - Webhook endpoints for CRM

### New DTOs
- `src/crm/dto/crm-identity.dto.ts` - Identity search DTOs
- Updated `src/crm/dto/crm-customer.dto.ts` - Person/Organization structures

### Updated Configuration
- `.env` - Actual CRM and Finance credentials
- `.env.example` - Updated with correct values
- `src/config/configuration.ts` - CRM username/password instead of token

---

## 🧪 Testing

### Test 1: Check APIs
```powershell
npm run check-apis
```

**Expected:**
```
✅ CRM token configured: eyJhbGci...
   URL: http://172.16.16.16/api/v2/auth/login
   Username: webservice
✅ Finance session obtained: 5e311c4b...
```

### Test 2: Run Initial Import
```powershell
npm run initial-import
```

**Watch logs for:**
- Fetching from Siagh
- Creating in CRM
- Mapping creation

### Test 3: Send Test Webhook
```bash
curl -X POST http://localhost:3000/webhook/crm/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Check logs** - full payload will be logged.

### Test 4: Monitor Database
```powershell
npm run prisma:studio
```

Check:
- `EntityMapping` - See imported customers
- `SyncLog` - See all operations with full details

---

## 📝 Data Mapping Summary

### Siagh → CRM Person
```
Siagh.Code          → CRM.customerNumber (unique key)
Siagh.FullName      → CRM.nickName + firstName/lastName
Siagh.MobileNo      → CRM.phoneContacts[0] (Mobile)
Siagh.TelNo         → CRM.phoneContacts[1] (Office)
Siagh.Email         → CRM.email
Siagh.Address       → CRM.addressContacts[0].address
Siagh.CodeShahr     → CRM.addressContacts[0].city
Siagh.CodeOstan     → CRM.addressContacts[0].state
Siagh.PoCode        → CRM.addressContacts[0].zipCode
Siagh.Tozihat       → CRM.description
```

### CRM Identity → Finance Contact
```
CRM.identityId      → EntityMapping.crmId
CRM.customerNumber  → EntityMapping.financeId (links by number)
CRM.nickName        → Finance.fullname
CRM.phoneContacts   → Extract mobile/office
CRM.addressContacts → Extract primary address
CRM.email           → Finance.email
CRM.nationalCode    → Finance.nationalCode
CRM.economicCode    → Finance.economicCode
```

---

## 🎯 Next Steps

1. ✅ Build and deploy to Windows
2. ✅ Run initial import
3. ✅ Register webhooks in CRM
4. ✅ Test webhook with test endpoint
5. ✅ Monitor logs to verify data structures
6. ✅ Adjust mappings if needed based on logs

---

**Everything is ready!** See logs for all data structures. 🚀

