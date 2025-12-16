# Current Sync Status

## ✅ What We Have

### 1. Webhook Endpoints (Working)
- ✅ `POST /webhook/crm/identity` - Receives webhooks, logs everything
- ✅ `POST /webhook/crm/invoice` - Receives webhooks, logs everything
- ✅ `POST /webhook/crm/test` - Test endpoint for debugging

### 2. Job Queue System (Working)
- ✅ Webhooks are queued for async processing
- ✅ Job processor handles webhook events
- ✅ Retry logic with exponential backoff

### 3. Initial Import (Working)
- ✅ Imports from Siagh → CRM
- ✅ Uses RecordId as unique key
- ✅ Handles Person/Organization based on TowardType

### 4. API Clients (Partial)
- ✅ `SiaghApiClient.getAllUsers()` - Get all contacts
- ✅ `SiaghApiClient.login()` - Authentication
- ✅ `CrmIdentityApiClient.searchAllIdentities()` - Get all CRM identities
- ✅ `CrmIdentityApiClient.createPerson()` - Create person in CRM
- ✅ `CrmIdentityApiClient.createOrganization()` - Create org in CRM

---

## ❌ What's Missing

### 1. Identity Sync Service (CRM → Siagh)
**Status:** ❌ NOT IMPLEMENTED

**What it should do:**
1. Receive webhook with identityId
2. Fetch full identity from CRM (`/api/v2/crmobject/person/get` or `/organization/get`)
3. Check if exists in Siagh (by RecordId in refId field or customerNumber)
4. If NOT exists → Create in Siagh using `SaveFormData`
5. If exists → Update in Siagh
6. Store/update entity mapping

**Missing Methods:**
- `SiaghApiClient.createContact()` - Create contact in Siagh
- `SiaghApiClient.updateContact()` - Update contact in Siagh
- `SiaghApiClient.findContactByRecordId()` - Find by RecordId
- `CrmIdentityToSiaghService.syncIdentity()` - Main sync logic

### 2. Invoice Sync Service (CRM → Siagh)
**Status:** ❌ NOT IMPLEMENTED

**What it should do:**
1. Receive webhook with invoiceId
2. Fetch full invoice from CRM
3. Transform to Siagh pre-invoice format
4. Create pre-invoice in Siagh using `SaveFormData` with formId="43D81"
5. Store mapping

**Missing Methods:**
- `SiaghApiClient.createPreInvoice()` - Create pre-invoice in Siagh
- `CrmInvoiceApiClient.getInvoice()` - Get invoice from CRM
- `InvoiceToSiaghService.syncInvoice()` - Main sync logic

### 3. Siagh API Methods
**Status:** ❌ MISSING

**Need to implement:**
```typescript
// In SiaghApiClient:
async createContact(data: CreateSiaghContactRequest): Promise<string>
async updateContact(code: string, data: CreateSiaghContactRequest): Promise<string>
async findContactByRecordId(recordId: string): Promise<SiaghUserDto | null>
async findContactByCustomerNumber(customerNumber: string): Promise<SiaghUserDto | null>
async createPreInvoice(data: CreateSiaghPreInvoiceRequest): Promise<string>
```

---

## 📋 Implementation Plan

### Step 1: Add Siagh API Methods
- [ ] `createContact()` - POST /BpmsApi/SaveFormData (formId: "2BFDA")
- [ ] `updateContact()` - POST /BpmsApi/SaveFormData (with CodeMain parameter)
- [ ] `findContactByRecordId()` - Search in getAllUsers() results
- [ ] `findContactByCustomerNumber()` - Search by Code field
- [ ] `createPreInvoice()` - POST /BpmsApi/SaveFormData (formId: "43D81")

### Step 2: Create Identity Sync Service
- [ ] `CrmIdentityToSiaghService` class
- [ ] `syncIdentity()` method:
  - Fetch from CRM
  - Check existence in Siagh
  - Create or update
  - Store mapping

### Step 3: Create Invoice Sync Service
- [ ] `CrmInvoiceToSiaghService` class
- [ ] `syncInvoice()` method:
  - Fetch from CRM
  - Transform to Siagh format
  - Create pre-invoice
  - Store mapping

### Step 4: Update Job Processor
- [ ] Call `CrmIdentityToSiaghService.syncIdentity()` in `processCrmIdentityWebhook()`
- [ ] Call `CrmInvoiceToSiaghService.syncInvoice()` in `processCrmInvoiceWebhook()`

---

## 🎯 Current Flow (What Happens Now)

```
CRM Webhook → CrmWebhookController
              ↓
         Queue Job
              ↓
      SyncJobProcessor
              ↓
    processCrmIdentityWebhook()
              ↓
         ⚠️  LOGS ONLY
         (No actual sync)
```

## 🎯 Target Flow (What Should Happen)

```
CRM Webhook → CrmWebhookController
              ↓
         Queue Job
              ↓
      SyncJobProcessor
              ↓
    processCrmIdentityWebhook()
              ↓
    CrmIdentityToSiaghService
              ↓
    1. Fetch from CRM
    2. Check in Siagh
    3. Create/Update
    4. Store mapping
              ↓
         ✅ SYNCED
```

---

**Next Steps:** Implement the missing services and API methods.

