# Customer Number Mapping Guide

## Overview
This document explains how customer numbers are mapped between CRM (Payamgostar) and Siagh Finance systems.

---

## Customer Number Format

### CRM Format
- **Format**: `100-{number}`
- **Example**: `100-1231`
- **Field**: `customerNumber` (or `customerNo` in search results)
- **Description**: Full customer number with prefix

### Siagh Format
- **Format**: `{number}` (value after dash)
- **Example**: `1231`
- **Field**: `tmpid`
- **Description**: Customer identifier without prefix

---

## Mapping Rules

### CRM → Siagh (Ongoing Sync)

When syncing an identity from CRM to Siagh:

1. **Extract tmpid from customerNumber**:
   ```
   CRM customerNumber: "100-1231"
   ↓ Extract value after dash
   Siagh tmpid: "1231"
   ```

2. **Use tmpid to find existing contact**:
   - Search in Siagh by tmpid
   - If found, update the contact
   - If not found, create new contact

3. **Implementation**:
   - File: `src/sync/orchestrator/crm-identity-to-siagh.service.ts:252`
   - Uses: `extractSiaghTmpId()` utility function

### Siagh → CRM (Initial Import)

When importing identities from Siagh to CRM:

1. **Build customerNumber from tmpid**:
   ```
   Siagh tmpid: "1231"
   ↓ Add prefix "100-"
   CRM customerNumber: "100-1231"
   ```

2. **Check for duplicates**:
   - Build full customerNumber from tmpid
   - Check if it exists in CRM
   - Skip if already exists

3. **Implementation**:
   - Files:
     - `src/sync/orchestrator/initial-import.service.ts:377` (Person)
     - `src/sync/orchestrator/initial-import.service.ts:426` (Organization)
   - Uses: `buildCrmCustomerNumber()` utility function

---

## Utility Functions

Location: `src/common/utils/customer-number.util.ts`

### extractSiaghTmpId()

Extracts the Siagh tmpid from a CRM customer number.

```typescript
extractSiaghTmpId("100-1231")  // Returns: "1231"
extractSiaghTmpId("1231")      // Returns: "1231" (no dash)
extractSiaghTmpId(undefined)   // Returns: undefined
```

**Parameters**:
- `crmCustomerNumber: string | undefined` - CRM customer number

**Returns**:
- `string | undefined` - Siagh tmpid (value after dash)

### buildCrmCustomerNumber()

Builds a CRM customer number from a Siagh tmpid.

```typescript
buildCrmCustomerNumber("1231")       // Returns: "100-1231"
buildCrmCustomerNumber("100-1231")   // Returns: "100-1231" (already has prefix)
buildCrmCustomerNumber(undefined)    // Returns: undefined
```

**Parameters**:
- `siaghTmpId: string | undefined` - Siagh tmpid

**Returns**:
- `string | undefined` - CRM customer number with prefix

### isCrmCustomerNumberFormat()

Checks if a customer number is in the correct CRM format.

```typescript
isCrmCustomerNumberFormat("100-1231")  // Returns: true
isCrmCustomerNumberFormat("1231")      // Returns: false
isCrmCustomerNumberFormat(undefined)   // Returns: false
```

**Parameters**:
- `customerNumber: string | undefined` - Customer number to check

**Returns**:
- `boolean` - True if format is "100-{number}"

---

## Field Relationships

### CRM Fields
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `identityId` | UUID | CRM unique identifier | "8adeeabc-fab9-4a77-a906-e47ac59373a7" |
| `customerNumber` | String | Full customer number | "100-1231" |
| `refId` | String | Stores Siagh tmpid for reference | "1231" |

### Siagh Fields
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `tmpid` | String | Unique identifier (customer number without prefix) | "1231" |
| `Code` | Number | Siagh internal code (auto-generated) | 1234 |
| `RecordId` | String | Legacy ID (deprecated) | "rec_xyz" |

### EntityMapping Table
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `crmId` | String | CRM identityId | "8adeeabc-fab9-4a77-a906-e47ac59373a7" |
| `financeId` | String | Siagh Code (as string) | "1234" |

---

## Data Flow Examples

### Example 1: Create New Customer in CRM → Sync to Siagh

```
Step 1: Create in CRM
  identityId: "8adeeabc-fab9-4a77-a906-e47ac59373a7"
  customerNumber: "100-1231"
  nickName: "John Doe"

Step 2: Webhook triggers sync
  ↓

Step 3: Extract Siagh tmpid
  extractSiaghTmpId("100-1231") → "1231"
  ↓

Step 4: Create in Siagh
  tmpid: "1231"
  fullname: "John Doe"
  ↓
  Returns: Code = 1234

Step 5: Store mapping
  EntityMapping:
    crmId: "8adeeabc-fab9-4a77-a906-e47ac59373a7"
    financeId: "1234"
```

### Example 2: Import Existing Customer from Siagh → CRM

```
Step 1: Fetch from Siagh
  tmpid: "5678"
  Code: 5000
  Name: "Jane Smith"

Step 2: Build CRM customerNumber
  buildCrmCustomerNumber("5678") → "100-5678"
  ↓

Step 3: Check for duplicates
  Search CRM by customerNumber "100-5678"
  ↓ Not found

Step 4: Create in CRM
  customerNumber: "100-5678"
  refId: "5678"
  nickName: "Jane Smith"
  ↓
  Returns: identityId = "new-uuid"

Step 5: Store mapping
  EntityMapping:
    crmId: "new-uuid"
    financeId: "5000" (Siagh Code)
```

---

## Important Notes

### 1. Prefix is Fixed
The prefix "100-" is hardcoded in the utility functions. If this needs to change, update the `CUSTOMER_NUMBER_PREFIX` constant in `customer-number.util.ts`.

### 2. EntityMapping.financeId
The `financeId` field in EntityMapping stores the Siagh **Code** (numeric ID), NOT the tmpid. This is because Code is the primary identifier returned by Siagh APIs.

### 3. Backward Compatibility
The utility functions handle both formats:
- If a value already has the prefix, it's returned as-is
- If a value has no dash, it's treated as the number part

### 4. Finding Contacts
When looking up contacts in Siagh:
- Use `findContactByTmpId(tmpid)` to search by tmpid
- Use `findContactByCustomerNumber(number)` to search by Code (numeric)

---

## Code References

### Modified Files

1. **src/common/utils/customer-number.util.ts**
   - New file with utility functions

2. **src/sync/orchestrator/crm-identity-to-siagh.service.ts**
   - Line 10: Import `extractSiaghTmpId`
   - Line 74: Log extracted tmpid
   - Line 84: Extract tmpid before lookup
   - Line 252: Extract tmpid in transformation

3. **src/sync/orchestrator/initial-import.service.ts**
   - Line 12: Import `buildCrmCustomerNumber`
   - Line 151: Build full customerNumber for duplicate check
   - Line 377: Build customerNumber for Person
   - Line 426: Build customerNumber for Organization

---

## Testing

### Manual Test: CRM → Siagh

1. Create a test person in CRM with `customerNumber: "100-9999"`
2. Check logs for "Siagh tmpid: 9999"
3. Verify in Siagh that tmpid = "9999"

### Manual Test: Siagh → CRM

1. Create a test contact in Siagh with `tmpid: "8888"`
2. Run initial import
3. Verify in CRM that `customerNumber: "100-8888"`

---

## Troubleshooting

### Issue: Contact not found in Siagh
**Cause**: tmpid extraction failed or format mismatch
**Solution**: Check that CRM customerNumber has format "100-{number}"

### Issue: Duplicate contacts created
**Cause**: Mapping not stored correctly
**Solution**: Check EntityMapping table and ensure financeId is correctly set

### Issue: Import creates duplicate in CRM
**Cause**: Customer number format mismatch in duplicate check
**Solution**: Ensure buildCrmCustomerNumber is used in duplicate check logic

---

## Version History

- **2025-12-23**: Initial documentation
  - Implemented customer number extraction and formatting utilities
  - Updated CRM → Siagh sync to extract tmpid
  - Updated Siagh → CRM import to build full customerNumber
