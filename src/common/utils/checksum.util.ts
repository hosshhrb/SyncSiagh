import * as crypto from 'crypto';

/**
 * Generate a checksum for an entity to detect changes
 * Normalizes the object before hashing to ensure consistent results
 */
export function generateChecksum(data: any): string {
  // Sort keys to ensure consistent hashing
  const normalized = sortObjectKeys(data);
  const jsonString = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Recursively sort object keys for consistent checksum generation
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = sortObjectKeys(obj[key]);
      return result;
    }, {} as any);
}

