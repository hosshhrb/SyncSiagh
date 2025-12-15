# Siagh Finance System Integration Guide

## Overview

The Finance system in this project is **Siagh** (سیاق), a Persian ERP/Finance management software. The actual API structure has been implemented based on official Siagh documentation.

## API Documentation

Based on Siagh API v8.3.1404.20812 documentation, the following endpoints are implemented:

### 1. Authentication (Login)

**Endpoint:** `POST /GeneralApi/LoginUser`

**Request:**
```json
{
  "UserName": "مدیر سیستم",
  "Password": "92C0ED8C3EC1DD67D834D3005A592A80"
}
```

**Note:** Password must be MD5 hashed!

**Response:**
```json
{
  "ContactCode": 2,
  "ContactName": "سید محمدرضا هاشمیان",
  "UserCode": 1,
  "UserName": "مدیر سیستم",
  "SessionId": "5e311c4b2eab409ca7c3ceaf5954d0a5",
  "Token": "5e311c4b2eab409ca7c3ceaf5954d0a5:0",
  "BranchCode": 1,
  "BranchName": "دفتر مرکزی",
  "IsAdminUser": true,
  "FiscalYear": 1404,
  "MobileNo": "9123456789",
  "SystemDate": "1404/09/04",
  "SystemTime": "17:33"
}
```

**Important:** Use `SessionId` (not Token) for subsequent requests in `Authorization` header.

### 2. Contact/Customer Management

#### Get All Contacts
**Endpoint:** `POST /api/Sgh/GEN/Gn_Web_Users/GetAll`

**Headers:**
```
Authorization: {SessionId}
Content-Type: application/json
```

**Request Body (optional filter):**
```json
{
  "TelNo": "09123456789"
}
```

Empty body returns all contacts.

#### Create Contact
**Endpoint:** `POST /BpmsApi/SaveFormData`

**Headers:**
```
Authorization: {SessionId}
Content-Type: application/json
```

**Request:**
```json
{
  "formId": "2BFDA",
  "ctrlValues": "NickName=dbgrid1.#nickname#|gn_web_users.isactive=1|gn_web_users.gender=|gn_web_users.websiteaddress=|gn_web_users.pocode=|gn_web_users.codeostan=|gn_web_users.address=|gn_web_users.codeshahr=|gn_web_users.countrycode=|gn_web_users.email=|gn_web_users.fullname=مخاطب تست|gn_web_users.mobileno=|gn_web_users.telno=021|gn_web_users.tmpid=|gn_web_users.tozihat=",
  "parameters": "CodeMain=",
  "dataRows": "[]",
  "attachments": "[]",
  "postCode": "1110",
  "flowId": ""
}
```

**Response:**
```json
{
  "Errors": [],
  "FinalMessages": [],
  "ReturnValue": true,
  "ReturnCode": "22",
  "ReturnParams": "22"
}
```

`ReturnCode` contains the new contact's code.

### 3. PreInvoice Management

#### Create PreInvoice
**Endpoint:** `POST /BpmsApi/SaveFormData`

**Request:**
```json
{
  "formId": "43D81",
  "ctrlValues": "sl_sanad.hssanadstate=8|sl_sanad.codenoeesanad=2|sl_sanad.codesalemodel=1|sl_sanad.salmali=1404|sl_sanad.codenoeepardakht=2|sl_sanad.codemarkazforush=2|sl_sanad.codecontact=8327|sl_sanad.codemoshtari=5500014|sl_sanad.codenoeeforush=1|sl_sanad.codevaseteh=31|sl_sanad.tozihat=|sl_sanad.namenoesanad=پیش فاکتور فروش بنیان گاز",
  "parameters": "_In_EditKeys=|_In_Suid=BE8892DF92EA4C4986082AFED6F07DCB|nocheck=",
  "dataRows": "[{\"name\":\"dbgrid1\",\"entity\":\"sl_rizsanad\",\"keyField\":\"coderiz\",\"data\":[{\"__uid\":{\"oldValue\":\"f1bb740d\",\"newValue\":\"f1bb740d\"},\"_status\":{\"oldValue\":\"inserted\",\"newValue\":\"inserted\"},\"codekala\":{\"oldValue\":null,\"newValue\":\"500102014\"},\"nameunit\":{\"oldValue\":null,\"newValue\":\"عدد\"},\"qty\":{\"oldValue\":null,\"newValue\":1},\"mabtakhfif\":{\"oldValue\":null,\"newValue\":0},\"vazn\":{\"oldValue\":null,\"newValue\":\"0\"},\"hajm\":{\"oldValue\":null,\"newValue\":\"0\"},\"price\":{\"oldValue\":null,\"newValue\":1},\"radif\":{\"oldValue\":null,\"newValue\":\"1\"},\"finalqty\":{\"oldValue\":null,\"newValue\":1},\"takhfif\":{\"oldValue\":null,\"newValue\":null},\"sumamelinc\":{\"oldValue\":null,\"newValue\":null},\"sumameldec\":{\"oldValue\":null,\"newValue\":null}}]}]",
  "attachments": "[]",
  "postCode": "1110",
  "flowId": ""
}
```

**Response:**
```json
{
  "Errors": [{
    "ColName": "",
    "Group": "",
    "ErrorType": "ErrSuccs",
    "Description": "پیش فاکتور فروش با موفقیت به شماره 2488 ثبت گردید خالص سند: 5,720,000",
    "ErrorCode": 0,
    "MessageText": "",
    "Solution": "",
    "HelpIndex": ""
  }],
  "FinalMessages": ["پیش فاکتور فروش با موفقیت به شماره 2488 ثبت گردید"],
  "ReturnValue": true,
  "ReturnCode": "15459",
  "ReturnParams": "458640"
}
```

## Implementation Details

### Files Structure

```
src/finance/
├── finance-auth.service.ts       # Siagh authentication
├── finance-api.client.ts         # Generic interface (kept for compatibility)
├── siagh-api.client.ts          # Actual Siagh API implementation
├── finance-siagh.adapter.ts     # Adapter between generic and Siagh
└── dto/
    ├── siagh-contact.dto.ts     # Siagh-specific contact DTOs
    ├── siagh-preinvoice.dto.ts  # Siagh-specific invoice DTOs
    ├── finance-customer.dto.ts   # Generic customer DTOs
    └── finance-preinvoice.dto.ts # Generic invoice DTOs
```

### Key Classes

**1. FinanceAuthService**
- Authenticates with Siagh login endpoint
- Stores `SessionId` for subsequent requests
- Handles session expiration and re-authentication

**2. SiaghApiClient**
- Direct implementation of Siagh API calls
- Handles form-based SaveFormData structure
- Manages complex dataRows format for invoices

**3. FinanceSiaghAdapter**
- Converts between generic DTOs and Siagh format
- Allows sync service to work with standard interfaces
- Handles data mapping and transformation

### Usage in Sync Service

The sync service can use either:

**Option A: Direct Siagh Client**
```typescript
constructor(private siaghClient: SiaghApiClient) {}

async syncCustomer() {
  const contacts = await this.siaghClient.getAllContacts();
  const response = await this.siaghClient.createContact(data, idempotencyKey);
}
```

**Option B: Adapter (Recommended)**
```typescript
constructor(private siaghAdapter: FinanceSiaghAdapter) {}

async syncCustomer() {
  const customer = await this.siaghAdapter.getCustomer(id);
  const created = await this.siaghAdapter.createCustomer(data, idempotencyKey);
}
```

## Configuration

### Environment Variables

```bash
# Siagh Finance System
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"  # MD5 hashed!
```

### Password Hashing

Siagh requires MD5 hashed passwords. To hash your password:

**Using Node.js:**
```javascript
const crypto = require('crypto');
const password = 'your-password';
const hashed = crypto.createHash('md5').update(password).digest('hex').toUpperCase();
console.log(hashed);
```

**Using OpenSSL:**
```bash
echo -n "your-password" | md5sum
```

**Using Online Tool:**
Visit: https://www.md5hashgenerator.com/

## Field Mappings

### Contact/Customer Fields

| CRM Field | Siagh Field | Description |
|-----------|-------------|-------------|
| name | fullname | نام کامل |
| mobile | mobileno | شماره موبایل |
| phone | telno | تلفن |
| email | email | ایمیل |
| address | address | آدرس |
| city | codeshahr | کد شهر |
| state | codeostan | کد استان |
| country | countrycode | کد کشور |
| postalCode | pocode | کد پستی |
| notes | tozihat | توضیحات |

### PreInvoice Fields

| Generic Field | Siagh Field | Values |
|---------------|-------------|---------|
| invoiceType | codenoeesanad | 2 = پیش فاکتور فروش |
| saleModel | codesalemodel | 1=بنیان گاز, 2=ابزار, ... |
| fiscalYear | salmali | 1404 |
| paymentType | codenoeepardakht | 1=نقدی, 2=چک, ... |
| customerId | codemoshtari | کد طرف حساب |
| contactId | codecontact | کد مخاطب |

## Error Handling

### Common Errors

**1. Duplicate Mobile Number**
```json
{
  "Errors": [{
    "Description": "شماره تلفن نمی تواند تکراری باشد.",
    "ErrorCode": -1
  }],
  "ReturnValue": false
}
```

**2. Invalid Price**
```json
{
  "Errors": [{
    "ColName": "Price",
    "Description": "قیمت ردیف 1 درست وارد نشده است",
    "ErrorCode": -1
  }],
  "ReturnValue": false
}
```

**3. Unauthorized (401)**
```json
{
  "Message": "Invalid username or password"
}
```

### Checking Response Success

```typescript
if (!siaghClient.isSuccessResponse(response)) {
  const errors = siaghClient.getErrorMessages(response);
  throw new Error(`Siagh error: ${errors.join(', ')}`);
}
```

## Testing

### Test Authentication
```bash
curl -X POST "http://172.16.16.15/GeneralApi/LoginUser" \
  -H "Content-Type: application/json" \
  -d '{"UserName":"مدیر سیستم","Password":"YOUR_MD5_HASH"}'
```

### Test Get Contacts
```bash
curl -X POST "http://172.16.16.15/api/Sgh/GEN/Gn_Web_Users/GetAll" \
  -H "Authorization: YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Important Notes

1. **SessionId vs Token**: Always use `SessionId` in Authorization header, not the `Token` field
2. **Password Must Be Hashed**: Siagh expects MD5 hashed passwords
3. **Form IDs**: Contact form = "2BFDA", PreInvoice form = "43D81"
4. **Persian Text**: Siagh fully supports Persian/Farsi text in all fields
5. **Fiscal Year**: Siagh uses Iranian calendar (1404 = 2025/2026)
6. **Complex Structure**: SaveFormData requires specific format - use provided examples
7. **Error Types**: Check `ErrorType` - "ErrSuccs" means success, "ErrError" means error

## Next Steps

1. Test authentication with your Siagh credentials
2. Verify SessionId works for subsequent requests
3. Test creating a contact
4. Test retrieving contacts
5. Move to PreInvoice sync once customers work

## Support

For Siagh-specific questions, refer to:
- Official Siagh documentation
- Siagh support: https://siaq.com/
- API version: 8.3.1404.20812

