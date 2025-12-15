# Changelog

## [Updated] - Integration with Actual Siagh Finance System

### Added - Siagh Finance Integration

Based on official Siagh API documentation (v8.3.1404.20812), the following Siagh-specific implementations have been added:

#### New Files

**Authentication:**
- Updated `src/finance/finance-auth.service.ts` to use Siagh's `/GeneralApi/LoginUser` endpoint
- Implements SessionId-based authentication (not Bearer token)
- Stores FiscalYear from login response

**API Clients:**
- `src/finance/siagh-api.client.ts` - Direct Siagh API implementation
  - Contact management (Get All, Create, Update)
  - PreInvoice creation with complex dataRows structure
  - Form-based SaveFormData handling

**DTOs:**
- `src/finance/dto/siagh-contact.dto.ts` - Siagh contact/customer structures
- `src/finance/dto/siagh-preinvoice.dto.ts` - Siagh pre-invoice structures

**Adapters:**
- `src/finance/finance-siagh.adapter.ts` - Converts between generic DTOs and Siagh format
  - Maintains compatibility with existing sync service
  - Handles field mapping CRM ↔ Siagh

**Utilities:**
- `scripts/hash-password.ts` - MD5 password hasher for Siagh authentication

**Documentation:**
- `SIAGH_INTEGRATION.md` - Complete Siagh API reference
  - All endpoints with examples
  - Field mappings
  - Error handling
  - Testing procedures
- `SIAGH_SETUP.md` - Quick setup guide for Siagh
  - Password hashing instructions
  - Configuration steps
  - Troubleshooting

### Changed

**Authentication Flow:**
- Now uses Siagh's specific login endpoint
- Returns SessionId instead of Bearer token
- Authorization header uses SessionId directly (not "Bearer {token}")

**Environment Variables:**
- Updated `.env.example` with Siagh-specific notes
- Password field now requires MD5 hash
- Base URL format updated (no /api suffix needed)

**Finance Module:**
- Exports both generic `FinanceApiClient` and `SiaghApiClient`
- Exports `FinanceSiaghAdapter` for seamless integration

### API Differences from Initial Implementation

| Aspect | Initial (Generic) | Actual (Siagh) |
|--------|------------------|----------------|
| Login Endpoint | `/auth/login` | `/GeneralApi/LoginUser` |
| Auth Header | `Bearer {token}` | `{SessionId}` |
| Password | Plain/hashed | MD5 hashed (required) |
| Get Customers | GET `/customers` | POST `/api/Sgh/GEN/Gn_Web_Users/GetAll` |
| Create Customer | POST `/customers` | POST `/BpmsApi/SaveFormData` with formId |
| Create Invoice | POST `/preinvoices` | POST `/BpmsApi/SaveFormData` with complex dataRows |
| Response Format | Standard REST | Custom with ReturnValue/Errors array |

### Key Features

**SaveFormData Structure:**
```typescript
{
  formId: "2BFDA",              // Form identifier
  ctrlValues: "key=value|...",  // Pipe-separated key-value pairs
  parameters: "CodeMain=",      // Edit parameters
  dataRows: "[...]",            // JSON array for line items
  attachments: "[]",            // Attachments array
  postCode: "1110",             // Post code
  flowId: ""                    // Workflow ID
}
```

**Response Structure:**
```typescript
{
  Errors: [],                   // Array of error objects
  FinalMessages: [],            // Success messages
  ReturnValue: true/false,      // Operation success
  ReturnCode: "22",             // Entity code (for creates)
  ReturnParams: "22"            // Additional parameters
}
```

### Backward Compatibility

The generic `FinanceApiClient` is kept for:
1. Potential future support of other finance systems
2. Testing without Siagh connection
3. Reference implementation

For actual Siagh integration, use:
- `SiaghApiClient` for direct API calls
- `FinanceSiaghAdapter` for mapped operations (recommended)

### Migration Notes

If you've already started integration:

1. **Update .env:**
   ```bash
   npm run hash-password your-password
   # Copy the hash to FINANCE_PASSWORD in .env
   ```

2. **Update imports in sync service:**
   ```typescript
   // Old
   constructor(private financeClient: FinanceApiClient) {}
   
   // New (Option A: Direct)
   constructor(private siaghClient: SiaghApiClient) {}
   
   // New (Option B: Adapter - Recommended)
   constructor(private siaghAdapter: FinanceSiaghAdapter) {}
   ```

3. **Test connection:**
   ```bash
   npm run check-apis
   ```

### Testing

New test scripts:
```bash
npm run hash-password [password]  # Hash password for Siagh
npm run check-apis                # Verify Siagh connectivity
```

### Documentation Updates

- README.md: Added Siagh integration notes
- SETUP.md: Referenced Siagh-specific setup
- New comprehensive Siagh documentation added

### Notes

- Siagh uses Iranian calendar (FiscalYear 1404 = 2025/2026)
- All text fields support full Persian/Farsi
- Complex nested structures for invoices (dataRows)
- Form IDs are system-specific: Contact="2BFDA", PreInvoice="43D81"

---

## [Initial] - Core Sync Engine Implementation

### Added

- Complete two-way sync architecture
- NestJS project structure
- PostgreSQL + Prisma ORM
- Redis + BullMQ for job queue
- CRM (Payamgostar) integration
- Generic Finance API client (replaced by Siagh)
- Webhook and polling sync modes
- Conflict resolution (last-write-wins)
- Loop prevention mechanisms
- Comprehensive audit logging
- Docker Compose infrastructure
- Complete documentation

See IMPLEMENTATION.md for full details.

