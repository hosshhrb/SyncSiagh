# ✅ Changes Complete - Corrected Implementation

## Overview
Fixed the sync logic to properly use Siagh's field names and types:
1. **`tarafType`** field when **writing** to Siagh (0 = Person, 1 = Organization)
2. **`TowardType`** field when **reading** from Siagh (true = Person, false = Organization) 
3. **`TpmId`** as the unique identifier (not `TmpId`)

## Corrected Logic

### 1. Person vs Organization Detection

**When Reading from Siagh (GetAll API):**
- Field: `TowardType` (boolean)
- `TowardType = true` → Person
- `TowardType = false` → Organization

**When Writing to Siagh (SaveFormData API):**
- Field: `tarafType` (number)
- `tarafType = 0` → Person
- `tarafType = 1` → Organization

### 2. Unique Identifier
- Field name: `TpmId` (not `TmpId`)
- Used for entity mapping and lookups
- Stored in CRM's `refId` field

## Modified Files

### 1. `src/finance/dto/siagh-user.dto.ts`
```typescript
export interface SiaghUserDto {
  TpmId: string;             // ✅ Unique ID (corrected spelling)
  TowardType: boolean;       // ✅ true = Person, false = Organization (when reading)
  tarafType: number;         // ✅ 0 = Person, 1 = Organization (when writing)
  // ... other fields
}
```

### 2. `src/finance/dto/siagh-contact.dto.ts`
```typescript
export interface CreateSiaghContactRequest {
  tpmid?: string;            // ✅ Corrected spelling
  taraftype?: number;        // ✅ 0 = Person, 1 = Organization
  // ... other fields
}
```

### 3. `src/finance/siagh-api.client.ts`
- Added `findContactByTpmId()` method
- Create/Update contact includes `taraftype` field in `ctrlValues`:
  ```typescript
  `gn_web_users.tpmid=${data.tpmid ?? ''}`,
  `gn_web_users.taraftype=${data.taraftype ?? 0}`,
  ```

### 4. `src/sync/orchestrator/crm-identity-to-siagh.service.ts`
- Uses `findContactByTpmId()` for lookups
- Calculates `tarafType` when transforming:
  ```typescript
  const tarafType = identityType === 'Organization' ? 1 : 0;
  ```
- Passes `identityType` to transformer
- Sets `tpmid` and `taraftype` in request

### 5. `src/sync/orchestrator/initial-import.service.ts`
- Reads `TowardType` field from Siagh:
  ```typescript
  // TowardType: true = Person, false = Organization
  const isOrganization = user.TowardType === false;
  ```
- Uses `TpmId` for mapping:
  ```typescript
  financeId: user.TpmId
  ```
- Stores `TpmId` in CRM's `refId`:
  ```typescript
  refId: user.TpmId
  ```

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Read Field** | `TowardType` (wrong interpretation) | `TowardType` (correct: true=Person, false=Org) |
| **Write Field** | Not sent | `tarafType` (0=Person, 1=Org) |
| **Unique ID** | `TmpId` | `TpmId` (corrected spelling) |
| **Person Check (Read)** | `TowardType === false` | `TowardType === true` ✅ |
| **Org Check (Read)** | `TowardType === true` | `TowardType === false` ✅ |
| **Person Value (Write)** | N/A | `taraftype: 0` ✅ |
| **Org Value (Write)** | N/A | `taraftype: 1` ✅ |

## Testing Checklist

After deployment:
- [ ] Initial import correctly identifies Persons (TowardType=true)
- [ ] Initial import correctly identifies Organizations (TowardType=false)
- [ ] Entity mappings use TpmId
- [ ] CRM webhook creates Person with taraftype=0
- [ ] CRM webhook creates Organization with taraftype=1
- [ ] Siagh correctly receives and saves taraftype
- [ ] Lookups by TpmId work correctly

## Example Flow

**Scenario 1: Import Person from Siagh → CRM**
```
1. Siagh API returns: { TpmId: "abc", TowardType: true, ... }
2. Code detects: isOrganization = (TowardType === false) = false ✅
3. Creates Person in CRM with refId="abc"
4. Stores mapping: financeId="abc" (TpmId)
```

**Scenario 2: Sync Person from CRM → Siagh**
```
1. CRM webhook: identityType="Person", refId="abc"
2. Lookup by TpmId="abc"
3. Transform: tarafType = (identityType === 'Organization') ? 1 : 0 = 0 ✅
4. Send to Siagh: gn_web_users.taraftype=0 (Person)
```

**Scenario 3: Sync Organization from CRM → Siagh**
```
1. CRM webhook: identityType="Organization", refId="xyz"
2. Lookup by TpmId="xyz"
3. Transform: tarafType = (identityType === 'Organization') ? 1 : 0 = 1 ✅
4. Send to Siagh: gn_web_users.taraftype=1 (Organization)
```

---

**Status:** ✅ All Changes Complete  
**Date:** 2024-12-17  
**Corrected Issues:** TowardType logic, TpmId spelling, tarafType implementation
