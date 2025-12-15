# 🎯 Update Summary: Siagh Finance Integration

## What Changed?

You provided the **actual Siagh Finance API documentation**, which revealed that the real API structure is quite different from what was initially implemented. I've updated the entire Finance integration to match the actual Siagh system.

## 📋 Key Updates

### 1. **Authentication** ✅

**Before:**
```typescript
POST /auth/login
Authorization: Bearer {token}
```

**Now (Actual Siagh):**
```typescript
POST /GeneralApi/LoginUser
Body: { UserName, Password: "MD5_HASH" }
Response: { SessionId, Token, FiscalYear, ... }
Authorization: {SessionId}  // No "Bearer"
```

### 2. **Customer/Contact Management** ✅

**Before:**
```typescript
GET /customers/{id}
POST /customers
PUT /customers/{id}
```

**Now (Actual Siagh):**
```typescript
// Get All Contacts
POST /api/Sgh/GEN/Gn_Web_Users/GetAll
Body: { TelNo: "..." } // Optional filter

// Create Contact  
POST /BpmsApi/SaveFormData
Body: {
  formId: "2BFDA",
  ctrlValues: "gn_web_users.fullname=...|gn_web_users.mobileno=...|...",
  parameters: "CodeMain=",
  dataRows: "[]",
  ...
}
```

### 3. **PreInvoice Management** ✅

**Before:**
```typescript
POST /preinvoices
Body: { customerId, items: [...] }
```

**Now (Actual Siagh):**
```typescript
POST /BpmsApi/SaveFormData
Body: {
  formId: "43D81",
  ctrlValues: "sl_sanad.codemoshtari=...|sl_sanad.salmali=...|...",
  parameters: "_In_EditKeys=|_In_Suid=UUID|nocheck=",
  dataRows: "[{\"name\":\"dbgrid1\",\"entity\":\"sl_rizsanad\",\"data\":[...]}]",
  ...
}
```

## 📁 New Files Created

### Core Siagh Implementation

1. **`src/finance/siagh-api.client.ts`**
   - Direct implementation of Siagh API
   - Handles SaveFormData structure
   - Contact and PreInvoice creation

2. **`src/finance/finance-siagh.adapter.ts`**
   - Converts between generic DTOs ↔ Siagh format
   - Maintains compatibility with sync service
   - Recommended for use in sync logic

3. **`src/finance/dto/siagh-contact.dto.ts`**
   - Siagh-specific contact structures
   - SaveFormRequest and SaveFormResponse types

4. **`src/finance/dto/siagh-preinvoice.dto.ts`**
   - Siagh-specific invoice structures
   - Complex dataRows format

### Utilities

5. **`scripts/hash-password.ts`**
   - MD5 password hasher
   - Run: `npm run hash-password your-password`

### Documentation

6. **`SIAGH_INTEGRATION.md`** (Comprehensive)
   - All Siagh API endpoints with examples
   - Field mappings
   - Error handling guide
   - Testing procedures

7. **`SIAGH_SETUP.md`** (Quick Start)
   - Fast setup instructions
   - Password hashing guide
   - Troubleshooting
   - Common issues

8. **`CHANGELOG.md`**
   - Detailed change log
   - Migration notes

9. **`UPDATE_SUMMARY.md`** (This file)
   - Quick reference of what changed

### Updated Files

- `src/finance/finance-auth.service.ts` - Siagh authentication
- `src/finance/finance.module.ts` - Exports Siagh client & adapter
- `package.json` - Added `hash-password` script
- `README.md` - Added Siagh integration notes
- `.env.example` - Updated with Siagh format (blocked by gitignore)

## 🔄 Migration Path

### For Fresh Setup (Recommended)

1. **Hash your password:**
   ```bash
   npm run hash-password your-siagh-password
   ```

2. **Update .env:**
   ```bash
   FINANCE_API_BASE_URL="http://172.16.16.15"
   FINANCE_USERNAME="مدیر سیستم"
   FINANCE_PASSWORD="YOUR_MD5_HASH_HERE"
   ```

3. **Test connection:**
   ```bash
   npm run check-apis
   ```

4. **Start syncing:**
   ```bash
   npm run start:dev
   ```

### For Existing Implementations

If you've already started using the generic FinanceApiClient:

**Option A: Use Adapter (Easiest)**
```typescript
// In customer-sync.service.ts
constructor(
  private crmClient: CrmApiClient,
  private siaghAdapter: FinanceSiaghAdapter,  // Changed
  // ... other services
) {}

// Usage stays mostly the same
const customer = await this.siaghAdapter.getCustomer(id);
const created = await this.siaghAdapter.createCustomer(data, idempotencyKey);
```

**Option B: Use Direct Siagh Client**
```typescript
constructor(
  private crmClient: CrmApiClient,
  private siaghClient: SiaghApiClient,  // Changed
  // ... other services
) {}

// More control, but requires format conversion
const contacts = await this.siaghClient.getAllContacts();
const response = await this.siaghClient.createContact(siaghData, idempotencyKey);
```

## 🎯 What Works Now

✅ **Siagh Authentication**
- MD5 password hashing
- SessionId-based auth
- Automatic re-authentication on expiry

✅ **Contact Management**
- Get all contacts with optional filtering
- Create new contacts with proper formId structure
- Update existing contacts
- Field mapping between CRM and Siagh

✅ **PreInvoice Creation**
- Complex dataRows structure
- Support for multiple line items
- Siagh-specific field codes
- Fiscal year handling

✅ **Error Handling**
- Parse Siagh error responses
- Extract error messages
- Retry logic with session refresh

✅ **Documentation**
- Complete API reference
- Field mappings
- Code examples
- Troubleshooting guide

## 📊 Field Mapping Reference

### CRM → Siagh Contact

| CRM Field | Siagh Field | Notes |
|-----------|-------------|-------|
| name | fullname | Required |
| mobile | mobileno | Optional |
| phone | telno | Can check for duplicates |
| email | email | Optional |
| address | address | Full address string |
| city | codeshahr | City code |
| state | codeostan | State/province code |
| country | countrycode | Country code |
| postalCode | pocode | Postal/ZIP code |
| description | tozihat | Notes/comments |

### PreInvoice Codes

| Field | Code | Description |
|-------|------|-------------|
| codenoeesanad | 2 | پیش فاکتور فروش (PreInvoice) |
| codesalemodel | 1-6 | Sales model (1=بنیان گاز) |
| codenoeepardakht | 1-7 | Payment type (1=نقدی, 2=چک) |
| codenoeeforush | 1-6 | Sales type (1=غیر رسمی) |

## 🔐 Security Notes

1. **Password MUST be MD5 hashed** - Siagh won't accept plain text
2. **SessionId is sensitive** - Don't log full SessionId
3. **No Bearer prefix** - Authorization header is just the SessionId
4. **HTTPS recommended** - Use VPN/SSL for production

## 📝 Quick Commands

```bash
# Hash Siagh password
npm run hash-password your-password

# Test Siagh connectivity
npm run check-apis

# View all available commands
npm run
```

## 📚 Documentation Priority

1. **Start Here:** [SIAGH_SETUP.md](SIAGH_SETUP.md) - Quick setup
2. **Reference:** [SIAGH_INTEGRATION.md](SIAGH_INTEGRATION.md) - Full API docs
3. **Architecture:** [IMPLEMENTATION.md](IMPLEMENTATION.md) - Technical details
4. **General Setup:** [SETUP.md](SETUP.md) - Complete guide

## ✅ Validation Checklist

Before going live:

- [ ] Password is MD5 hashed
- [ ] Base URL has no `/api` suffix
- [ ] `npm run check-apis` succeeds
- [ ] Can retrieve contacts from Siagh
- [ ] Can create test contact in Siagh
- [ ] SessionId auth working
- [ ] Error responses properly parsed

## 🚀 What's Next?

1. **Test Siagh connection** with your actual credentials
2. **Verify contact sync** works both ways (CRM ↔ Siagh)
3. **Test PreInvoice creation** with sample data
4. **Monitor sync logs** in Prisma Studio
5. **Set up webhooks** if CRM supports them

## 💡 Pro Tips

1. **Use the adapter** (`FinanceSiaghAdapter`) - It handles all the complex format conversions
2. **Test authentication first** - Everything depends on valid SessionId
3. **Check fiscal year** - Siagh uses Iranian calendar (1404 = 2025/26)
4. **Persian text works** - Siagh fully supports Farsi in all fields
5. **Form IDs matter** - Contact=2BFDA, PreInvoice=43D81 (system-specific)

## 🆘 Common Issues

**"Invalid username or password"**
→ Password must be MD5 hashed. Run `npm run hash-password`

**"SessionId expired"**
→ Normal - system auto-re-authenticates. Just retry.

**"Connection refused"**
→ Check Siagh IP, port, and network access

**"FormId not found"**
→ Form IDs are system-specific. Verify with Siagh admin.

---

## Summary

The implementation now matches the **actual Siagh Finance System API** based on official documentation. All previous generic implementations remain for reference, but the Siagh-specific clients and adapters should be used for real integration.

**Ready to test!** Start with `npm run hash-password` and follow [SIAGH_SETUP.md](SIAGH_SETUP.md).

