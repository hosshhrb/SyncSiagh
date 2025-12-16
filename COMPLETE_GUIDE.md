# Complete Guide - Updated with Actual APIs

Everything configured with your actual CRM and Finance APIs.

---

## ✅ What's Done

### APIs Configured

**CRM (Payamgostar):**
- URL: `http://172.16.16.16`
- Username: `webservice`
- Password: `12345678`
- Login: `POST /api/v2/auth/login`
- Identity APIs: `/api/v2/crmobject/identity/*`
- Person APIs: `/api/v2/crmobject/person/*`
- Organization APIs: `/api/v2/crmobject/organization/*`

**Finance (Siagh):**
- URL: `http://172.16.16.15`
- Username: `مدیر سیستم`
- Password: `92C0ED8C3EC1DD67D834D3005A592A80` (MD5)
- Login: `POST /GeneralApi/LoginUser`
- Contacts: `POST /api/Sgh/GEN/Gn_Web_Users/GetAll`
- Save: `POST /BpmsApi/SaveFormData`

### Features Implemented

1. ✅ Initial import (Finance → CRM) with actual APIs
2. ✅ CRM webhook endpoints with full logging
3. ✅ Identity to Finance sync
4. ✅ Data mapping (Siagh ↔ CRM)
5. ✅ Complete logging of all structures
6. ✅ Duplicate prevention using customer number
7. ✅ Loop prevention
8. ✅ Idempotency
9. ✅ Comprehensive audit trail

---

## 🚀 Windows Deployment

### Step 1: Build on Linux

```bash
cd /home/h/SiaghSync
./scripts/build-for-production.sh
```

### Step 2: Copy to Windows

Copy `deployment/` folder to `C:\SiaghSync` on Windows.

### Step 3: Setup on Windows

```powershell
# Open PowerShell as Administrator
cd C:\SiaghSync
.\deploy-windows.ps1

# Setup database
npx prisma migrate deploy

# Test APIs
npm run check-apis

# Run application
node dist/main.js
```

---

## 📊 Data Mappings

### Finance (Siagh) → CRM (Payamgostar)

```
Siagh.Code          → CRM.customerNumber ⭐ (unique key)
Siagh.FullName      → CRM.nickName
Siagh.FullName      → CRM.firstName + lastName (split)
Siagh.MobileNo      → CRM.phoneContacts (phoneType="Mobile")
Siagh.TelNo         → CRM.phoneContacts (phoneType="Office")
Siagh.Email         → CRM.email
Siagh.Address       → CRM.addressContacts.address
Siagh.CodeShahr     → CRM.addressContacts.city
Siagh.CodeOstan     → CRM.addressContacts.state
Siagh.PoCode        → CRM.addressContacts.zipCode
Siagh.Tozihat       → CRM.description
```

### CRM (Payamgostar) → Finance (Siagh)

```
CRM.identityId      → Mapping.crmId
CRM.customerNumber  → Mapping.financeId ⭐ (links by number)
CRM.nickName        → Finance.fullname
CRM.phoneContacts   → Finance.mobileno / telno
CRM.addressContacts → Finance.address / city / state
CRM.email           → Finance.email
CRM.nationalCode    → Finance (future)
CRM.economicCode    → Finance (future)
```

---

## 🔗 Webhook Setup in CRM

Register these webhooks in CRM settings:

### Identity Webhook
```
URL: http://YOUR_SERVER_IP:3000/webhook/crm/identity
Method: POST
Events: identity.created, identity.updated
```

### Invoice Webhook
```
URL: http://YOUR_SERVER_IP:3000/webhook/crm/invoice
Method: POST
Events: invoice.created, invoice.updated
```

### Test Webhook (Use First!)
```
URL: http://YOUR_SERVER_IP:3000/webhook/crm/test
Method: POST
```

**Test it:**
```bash
curl -X POST http://localhost:3000/webhook/crm/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "identityId": "123"}'
```

---

## 📋 Complete Workflow

### 1. Initial Setup (One-Time)

```powershell
# On Windows
cd C:\SiaghSync

# Deploy
.\deploy-windows.ps1

# Setup database
npx prisma migrate deploy

# Test APIs
npm run check-apis
```

### 2. Initial Import (One-Time)

```powershell
# Run initial import
npm run initial-import
```

**This will:**
- Fetch all contacts from Finance (Siagh)
- Create them in CRM (Payamgostar) as Persons
- Use customer number to prevent duplicates
- Create entity mappings

**Watch logs for:**
```
📥 Fetching all contacts from Siagh Finance...
   Found 150 contacts
📥 Fetching existing identities from CRM...
   Found 50 identities
➕ Creating person in CRM: Company ABC (12345)
✅ Imported: Company ABC → CRM ID: abc-uuid
...
📊 Import Summary:
   ✅ Imported: 100
   ⏭️  Skipped: 50
   ❌ Errors: 0
```

### 3. Register Webhooks in CRM

In CRM admin panel:
1. Find webhook/integration settings
2. Add identity webhook URL
3. Add invoice webhook URL
4. Test with test endpoint first

### 4. Start Application and Monitor

```powershell
node dist/main.js
```

**Logs show:**
- Every webhook received
- Complete payload and headers
- Full sync process
- Success/failure

### 5. Verify in Database

```powershell
npm run prisma:studio
```

Check:
- `EntityMapping` - See all linked entities
- `SyncLog` - See every operation with full details

---

## 📊 What You'll See in Logs

### When Webhook Received
```
📨 ================== CRM IDENTITY WEBHOOK RECEIVED ==================
   Event ID: 1702891234567
📋 Headers: {...}
📦 Payload: {...}
========================================================================
✅ Webhook queued for processing
```

### When Processing Webhook
```
🔄 ================== SYNCING IDENTITY TO FINANCE ==================
   Identity ID: abc-123
📥 Fetching identity from CRM...
   Person: John Doe
📋 CRM Identity Data: {...}  ← Full structure logged
🔄 Transforming to Finance format...
📋 Finance Data to Send: {...}  ← What we're sending
✅ Created Finance customer xyz-789
========================================================================
```

### All Data Structures Logged

- ✅ CRM webhook payload (raw)
- ✅ CRM identity structure (from GET API)
- ✅ Finance contact structure (what we send)
- ✅ Finance response (what we get back)
- ✅ Entity mapping creation
- ✅ Errors with full stack trace

---

## 🔍 Debugging

### See What CRM Sends

1. Start application: `node dist/main.js`
2. Send test webhook: `curl -X POST http://localhost:3000/webhook/crm/test ...`
3. Check console logs - full structure logged
4. Adjust data mapping if needed

### See What Finance Expects

1. Check logs when creating customer
2. See `Finance Data to Send` in logs
3. See Finance API response
4. Adjust if errors occur

### View All Operations

```powershell
npm run prisma:studio
```

- `SyncLog` table has everything
- Filter by status (SUCCESS/FAILED)
- View full payloads

---

## 🎯 Commands Summary

```powershell
# Build (on Linux)
./scripts/build-for-production.sh

# Deploy (on Windows)
.\deploy-windows.ps1

# Database
npx prisma migrate deploy

# Test
npm run check-apis

# Import
npm run initial-import

# Run
node dist/main.js

# Monitor
npm run prisma:studio
```

---

## 📚 Documentation

- `IMPLEMENTATION_SUMMARY.md` - This file
- `CRM_WEBHOOK_SETUP.md` - How to register webhooks
- `CRM_API_ACTUAL.md` - CRM API documentation
- `WINDOWS_DEPLOY_STEPS.md` - Windows deployment
- `WINDOWS_START.txt` - Simple text guide

---

**Everything is configured correctly!** 

1. Deploy to Windows
2. Run initial import
3. Register webhooks
4. Watch the logs! 🚀

