# Actual CRM API Documentation

Based on your Payamgostar CRM API structure.

---

## 🔑 Configuration

**CRM Base URL:** `http://172.16.16.16`

**Credentials:**
```bash
CRM_USERNAME="webservice"
CRM_PASSWORD="12345678"
```

---

## 🔐 Authentication

### Login

**Endpoint:** `POST /api/v2/auth/login`

**Request:**
```json
{
  "username": "webservice",
  "password": "12345678",
  "deviceId": "SiaghSync-Server",
  "platformType": 1,
  "os": "string",
  "osVersion": "string",
  "token": "string"
}
```

**Response:**
```json
{
  "expiresAt": "2025-12-16T11:43:53.1385332+03:30",
  "accessToken": "eyJhbGci...",
  "refreshToken": "D9dVEK4..."
}
```

**Use:** `Authorization: Bearer {accessToken}` for subsequent requests

---

## 👥 Identity APIs

### 1. Get Identities Simple

**Endpoint:** `POST /api/v2/crmobject/identity/getIdentitiesSimple`

**Request:**
```json
{
  "pageNumber": 0,
  "pageSize": 150,
  "searchTerm": "",
  "identityType": 1  // 1=Person, 2=Organization
}
```

**Response:**
```json
[
  {
    "identityId": "2022fbc6-b822-48a7-9586-091dff902212",
    "nickName": "POLY MEDICURE Limited",
    "customerNo": ""
  },
  {
    "identityId": "e816174e-3575-45c7-8c7b-855aff56a483",
    "nickName": "RI.MOS. S.r.l.",
    "customerNo": ""
  }
]
```

### 2. Get All Identities

**Endpoint:** `POST /api/v2/crmobject/identity/getIdentities`

Same request/response structure as `getIdentitiesSimple`.

### 3. Get Customers Only

**Endpoint:** `POST /api/v2/crmobject/identity/getCustomers`

Returns only customers (not all identities).

### 4. Search Identities

**Endpoint:** `POST /api/v2/crmobject/identity/search`

Search with filters.

---

## 👤 Person APIs

### Get Person

**Endpoint:** `POST /api/v2/crmobject/person/get`

**Request:**
```json
{
  "id": "person-id-here"
}
```

### Create Person

**Endpoint:** `POST /api/v2/crmobject/person/create`

**Request:**
```json
{
  "nickName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneContacts": [
    {
      "default": true,
      "phoneType": "Mobile",
      "phoneNumber": "09123456789"
    }
  ],
  "addressContacts": [
    {
      "default": true,
      "country": "Iran",
      "city": "Tehran",
      "address": "Sample Address",
      "zipCode": "1234567890"
    }
  ],
  "nationalCode": "1234567890",
  "economicCode": "",
  "customerNumber": "CUST001",
  "description": "Customer from Finance system"
}
```

**Response:**
```json
{
  "id": "new-person-id"
}
```

### Update Person

**Endpoint:** `POST /api/v2/crmobject/person/update`

Same structure as create, but include `id` field.

### Delete Person

**Endpoint:** `POST /api/v2/crmobject/person/delete`

**Request:**
```json
{
  "id": "person-id-to-delete"
}
```

---

## 🏢 Organization APIs

### Get Organization

**Endpoint:** `POST /api/v2/crmobject/organization/get`

**Request:**
```json
{
  "id": "organization-id-here"
}
```

### Create Organization

**Endpoint:** `POST /api/v2/crmobject/organization/create`

**Request:**
```json
{
  "nickName": "Company Name Ltd",
  "email": "info@company.com",
  "phoneContacts": [
    {
      "default": true,
      "phoneType": "Office",
      "phoneNumber": "02112345678"
    }
  ],
  "addressContacts": [
    {
      "default": true,
      "country": "Iran",
      "city": "Tehran",
      "address": "Company Address",
      "zipCode": "1234567890"
    }
  ],
  "nationalCode": "1234567890",
  "economicCode": "123456",
  "registerNumber": "123456",
  "customerNumber": "CUST002",
  "businessType": "Private",
  "description": "Customer from Finance system"
}
```

**Response:**
```json
{
  "id": "new-organization-id"
}
```

### Update Organization

**Endpoint:** `POST /api/v2/crmobject/organization/update`

Same structure as create, but include `id` field.

### Delete Organization

**Endpoint:** `POST /api/v2/crmobject/organization/delete`

**Request:**
```json
{
  "id": "organization-id-to-delete"
}
```

---

## 📊 Field Mapping: Siagh → CRM

### Contact → CRM Person

| Siagh Field | CRM Field | Notes |
|-------------|-----------|-------|
| FullName | nickName | Display name |
| FullName | firstName + lastName | Split if possible |
| Code | customerNumber | Unique identifier |
| MobileNo | phoneContacts[0].phoneNumber | phoneType="Mobile" |
| TelNo | phoneContacts[1].phoneNumber | phoneType="Office" |
| Email | email | Primary email |
| Address | addressContacts[0].address | Full address |
| CodeShahr | addressContacts[0].city | City |
| CodeOstan | addressContacts[0].state | State/Province |
| PoCode | addressContacts[0].zipCode | Postal code |
| Tozihat | description | Notes/description |

### Key Points

1. **customerNumber** is the unique key - use Siagh's `Code` field
2. **phoneContacts** is an array - can have multiple phones
3. **addressContacts** is an array - can have multiple addresses
4. **identityType**: 1=Person, 2=Organization
5. All endpoints use **POST** (not GET)

---

## 🔄 Sync Strategy

### Initial Import: Finance (Siagh) → CRM

1. Get all contacts from Siagh: `POST /api/Sgh/GEN/Gn_Web_Users/GetAll`
2. For each contact:
   - Check if exists in CRM by `customerNumber`
   - If not exists, create in CRM:
     - Use `POST /api/v2/crmobject/person/create`
     - Or `POST /api/v2/crmobject/organization/create`
   - Create entity mapping

### Ongoing Sync: CRM → Finance

1. Get identities from CRM: `POST /api/v2/crmobject/identity/getIdentitiesSimple`
2. For each identity:
   - Check if exists in Finance by `customerNumber`
   - If not exists, create in Finance
   - If exists, update if changed

---

## 🧪 Testing the APIs

### Test Authentication

```bash
curl -X POST http://172.16.16.16/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "webservice",
    "password": "12345678",
    "deviceId": "test",
    "platformType": 1,
    "os": "Linux",
    "osVersion": "1.0",
    "token": ""
  }'
```

### Test Get Identities

```bash
curl -X POST http://172.16.16.16/api/v2/crmobject/identity/getIdentitiesSimple \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "pageNumber": 0,
    "pageSize": 10,
    "searchTerm": "",
    "identityType": 1
  }'
```

---

## 📝 Implementation Notes

### Services Updated

1. **CrmAuthService** - Uses actual credentials (webservice/12345678)
2. **CrmIdentityApiClient** - New service for Identity/Person/Organization APIs
3. **InitialSyncService** - Will import from Siagh to CRM using these endpoints

### Environment Configuration

Your `.env` now has:
```bash
CRM_API_BASE_URL="http://172.16.16.16"
CRM_USERNAME="webservice"
CRM_PASSWORD="12345678"
```

### Next Steps

1. Build with updated API structure
2. Deploy to Windows
3. Run `npm run check-apis` to test CRM connection
4. Run `npm run initial-import` to import from Siagh to CRM

---

**Ready to use actual CRM APIs!** 🚀

