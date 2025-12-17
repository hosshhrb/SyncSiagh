# Changes Summary - tarafType and TmpId Implementation

## Overview
Updated the sync logic to use Siagh's `tarafType` field for person/organization detection and `TmpId` as the unique identifier instead of `RecordId`.

## Changes Made

### 1. Person vs Organization Detection
**Before:** Used `TowardType` (boolean: `false` = Person, `true` = Organization)  
**After:** Uses `tarafType` (number: `0` = Person, `1` = Organization)

### 2. Unique Identifier
**Before:** Used `RecordId` for entity mapping  
**After:** Uses `TmpId` for entity mapping

## Modified Files

### 1. `src/finance/dto/siagh-user.dto.ts`
- Added `TmpId: string` field (primary unique identifier)
- Added `tarafType: number` field (0 = Person, 1 = Organization)
- Kept `RecordId` and `TowardType` as legacy fields for backward compatibility
- Updated comments to reflect new usage

### 2. `src/finance/siagh-api.client.ts`
- Added new method: `findContactByTmpId(tmpId: string)` - primary lookup method
- Marked `findContactByRecordId()` as `@deprecated` but kept for compatibility
- Updated comments to reference TmpId

### 3. `src/sync/orchestrator/crm-identity-to-siagh.service.ts`
- Changed lookup logic to use `findContactByTmpId()` instead of `findContactByRecordId()`
- Updated log messages: "Siagh RecordId" → "Siagh TmpId"
- Updated comment: "Store RecordId" → "Store TmpId"
- Stores CRM's `refId` as Siagh's `TmpId` in the `tmpid` field

### 4. `src/sync/orchestrator/initial-import.service.ts`
- Changed type detection: `user.TowardType === true` → `user.tarafType === 1`
- Changed all Person/Organization type checks to use `tarafType === 1` for Organization
- Renamed variable: `mappedRecordIds` → `mappedTmpIds`
- Updated entity mapping to store `user.TmpId` instead of `user.RecordId`
- Changed `refId` field to store `user.TmpId` when creating CRM entities
- Updated all log messages to reference TmpId
- Updated duplicate detection to use TmpId

### 5. `GUIDE.md`
- Added documentation section explaining:
  - Identity Type Detection using `tarafType`
  - Unique Identifier using `TmpId`
  - Relationship between CRM's `refId` and Siagh's `TmpId`

## Backward Compatibility

All changes maintain backward compatibility:
- Legacy `RecordId` field still exists in DTO
- Legacy `TowardType` field still exists in DTO  
- Deprecated method `findContactByRecordId()` still available
- Old code will continue to work, but should migrate to new fields

## Testing Required

After deployment, verify:
1. Initial import correctly identifies Person vs Organization using `tarafType`
2. Entity mappings use `TmpId` instead of `RecordId`
3. CRM webhook sync correctly stores and retrieves contacts by `TmpId`
4. Duplicate detection works with `TmpId`

## Data Migration (If Needed)

If you have existing entity mappings using `RecordId`:
1. The system will continue to work due to backward compatibility
2. New syncs will use `TmpId`
3. To fully migrate, update existing mappings to use `TmpId` values:
   ```sql
   -- Example migration query (adjust as needed)
   UPDATE "EntityMapping"
   SET "financeId" = (
     SELECT "TmpId" 
     FROM siagh_users 
     WHERE siagh_users."RecordId" = "EntityMapping"."financeId"
   );
   ```

## Summary

| Change | Old Value | New Value |
|--------|-----------|-----------|
| Person/Org Detection | `TowardType` (boolean) | `tarafType` (0/1) |
| Unique ID Field | `RecordId` | `TmpId` |
| Person Type Check | `TowardType === false` | `tarafType === 0` |
| Organization Type Check | `TowardType === true` | `tarafType === 1` |
| Lookup Method | `findContactByRecordId()` | `findContactByTmpId()` |

---

**Implementation Date:** 2024-12-17  
**Status:** ✅ Complete
