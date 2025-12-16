# Initial Import Algorithm

## Overview

Efficiently imports identities from **Siagh Finance** to **CRM (Payamgostar)**.

---

## Algorithm Steps

### Step 1: Parallel Data Fetch (O(1) - parallel API calls)

Fetch data from both systems **simultaneously**:

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Siagh API          │     │  CRM API            │     │  Database           │
│  GetAll Users       │     │  Search Identities  │     │  Entity Mappings    │
└─────────┬───────────┘     └─────────┬───────────┘     └─────────┬───────────┘
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      ▼
                              Promise.all()
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │  All data in memory     │
                        └─────────────────────────┘
```

### Step 2: Build Lookup Indexes (O(n))

Create **Set** and **Map** structures for O(1) lookups:

```javascript
// O(1) lookup for existing mappings
const mappedRecordIds = new Set(existingMappings.map(m => m.financeId));

// O(1) lookup for CRM identities by name
const crmByNickName = new Map();
for (const identity of crmIdentities) {
  crmByNickName.set(identity.nickName.toLowerCase(), identity);
}
```

**Why this is fast:**
- Set/Map lookups are O(1) average
- Single pass to build indexes
- Memory-efficient for large datasets

### Step 3: Filter Duplicates (O(n))

Single pass through Siagh users with O(1) lookups:

```
For each Siagh user:
  1. Check if RecordId in mappedRecordIds Set     → O(1)
  2. Check if Name in crmByNickName Map           → O(1)
  3. Check if IsActive                            → O(1)
  4. Check if IsAdminUser                         → O(1)
  
  If all checks pass → Add to import list
```

**Duplicate Detection:**
- **RecordId** = Unique identifier in Siagh
- Compare with CRM **identityId** (via refId field)
- Also compare by **Name** to catch existing entries

### Step 4: Batch Import (Parallel with concurrency limit)

Process imports in parallel batches:

```
┌────────────────────────────────────────────────────────────┐
│  Batch 1: Users 1-10                                       │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐│
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │ 7 │ │ 8 │ │ 9 │ │10 ││
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘│
│                    ↓ Promise.allSettled()                  │
│                    ┌───────────────────┐                   │
│                    │ Wait for all 10   │                   │
│                    └───────────────────┘                   │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│  Batch 2: Users 11-20                                      │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Parallel API calls (10 at a time by default)
- Single batch failure doesn't stop entire import
- Progress reporting per batch

### Step 5: Store Mappings (O(n))

For each successful import, store mapping:

```
EntityMapping {
  entityType: CUSTOMER
  crmId: "uuid-from-crm"           // CRM identity ID
  financeId: "uuid-from-siagh"     // Siagh RecordId
  lastSyncSource: FINANCE
  lastSyncTransactionId: "initial-import-timestamp"
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         SIAGH FINANCE                           │
│                                                                 │
│  GET /api/Sgh/GEN/Gn_Web_Users/GetAll                          │
│                                                                 │
│  Response: [                                                    │
│    {                                                            │
│      "RecordId": "451b4e87-7cff-...",  ← Unique Key            │
│      "Name": "مالک فولادزاده",                                  │
│      "MobileNo": "09355017404",                                │
│      "NationalCode": "0493349650",                             │
│      "TowardType": false,               ← false=Person         │
│      "Code": 3,                                                │
│      ...                                                       │
│    }                                                           │
│  ]                                                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TRANSFORM & FILTER                         │
│                                                                 │
│  1. Check: RecordId not in existing mappings                   │
│  2. Check: Name not in CRM identities                          │
│  3. Check: IsActive = true                                     │
│  4. Determine type: TowardType → Person or Organization        │
│                                                                 │
│  Transform to CRM format:                                      │
│  {                                                             │
│    "refId": "451b4e87-7cff-...",        ← Store RecordId       │
│    "nickName": "مالک فولادزاده",                                │
│    "firstName": "مالک",                                        │
│    "lastName": "فولادزاده",                                    │
│    "nationalCode": "0493349650",                               │
│    "phoneContacts": [{ phoneNumber: "09355017404" }],          │
│    "customerNumber": "3"                                       │
│  }                                                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CRM (PAYAMGOSTAR)                       │
│                                                                 │
│  POST /api/v2/crmobject/person/create                          │
│  or                                                            │
│  POST /api/v2/crmobject/organization/create                    │
│                                                                 │
│  Response: { "id": "new-crm-uuid" }                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                │
│                                                                 │
│  EntityMapping:                                                │
│  {                                                             │
│    crmId: "new-crm-uuid",                                      │
│    financeId: "451b4e87-7cff-...",  ← Links both systems       │
│    entityType: CUSTOMER,                                       │
│    lastSyncSource: FINANCE                                     │
│  }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## TowardType Field

Determines if identity is Person or Organization:

| TowardType | Type         | CRM API                              |
|------------|--------------|--------------------------------------|
| `false`    | Person       | POST /api/v2/crmobject/person/create |
| `true`     | Organization | POST /api/v2/crmobject/organization/create |

---

## Data Mapping

### Siagh → CRM Person

| Siagh Field    | CRM Field        | Notes                    |
|----------------|------------------|--------------------------|
| RecordId       | refId            | Stored for future sync   |
| Name           | nickName         | Full display name        |
| Name (split)   | firstName        | First word               |
| Name (split)   | lastName         | Remaining words          |
| MobileNo       | phoneContacts[]  | type: "Mobile"           |
| TelNo          | phoneContacts[]  | type: "Office"           |
| Email          | email            |                          |
| Address        | addressContacts[]|                          |
| PostalCode     | zipCode          |                          |
| NationalCode   | nationalCode     |                          |
| Code           | customerNumber   | Siagh code as string     |
| Description    | description      |                          |

---

## Performance Characteristics

| Operation          | Complexity | Notes                      |
|--------------------|------------|----------------------------|
| Fetch all data     | O(1)       | Parallel API calls         |
| Build indexes      | O(n)       | Single pass                |
| Filter duplicates  | O(n)       | O(1) lookups per record    |
| Import to CRM      | O(n/batch) | Parallel batched calls     |
| Store mappings     | O(n)       | Database inserts           |

**Total: O(n) with parallel optimization**

---

## Usage

```bash
# Run initial import
npm run initial-import

# View detailed logs
# All steps are logged with timing
```

---

## Output Example

```
═══════════════════════════════════════════════════════════════
   INITIAL IMPORT: Siagh Finance → CRM (Payamgostar)
═══════════════════════════════════════════════════════════════

📥 STEP 1: Fetching data from both systems (parallel)...
   ✅ Siagh users: 150
   ✅ CRM identities: 75
   ✅ Existing mappings: 50

🔍 STEP 2: Building lookup indexes...
   ✅ CRM identity lookup: 75 entries
   ✅ Mapped records lookup: 50 entries
   ✅ CRM nickName lookup: 75 entries

🔄 STEP 3: Identifying new records to import...
   ✅ To import: 25
   ⏭️  Skipped: 125

🚀 STEP 4: Importing 25 records to CRM (batch size: 10)...
   📦 Batch 1/3 (10 records)...
      ✅ مالک فولادزاده → abc-123
      ✅ عزت الله ظهرابی → def-456
      ...

═══════════════════════════════════════════════════════════════
   IMPORT COMPLETE
═══════════════════════════════════════════════════════════════
   📊 Total records: 150
   ✅ Imported: 25
   ⏭️  Skipped: 125
   ❌ Errors: 0
   ⏱️  Duration: 12.34s
═══════════════════════════════════════════════════════════════
```

---

## Files

- `src/sync/orchestrator/initial-import.service.ts` - Main import service
- `src/finance/siagh-api.client.ts` - Siagh API client
- `src/crm/crm-identity-api.client.ts` - CRM API client
- `scripts/initial-import.ts` - CLI script

---

**Efficient, parallel, and well-logged!** 🚀

