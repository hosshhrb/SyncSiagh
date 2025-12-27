/**
 * Customer Number Utilities
 *
 * Handles conversion between CRM and Siagh customer number formats:
 * - CRM format: "100-1XXX" (starts from 100-1001, not 100-0001)
 * - Siagh format: Actual code (e.g., 1, 2, 234, etc.)
 * - Offset: +1000 when creating CRM number, -1000 when extracting Siagh code
 */

const CUSTOMER_NUMBER_PREFIX = '100-';
const CUSTOMER_NUMBER_OFFSET = 1000; // CRM numbers start from 100-1001

/**
 * Extract Siagh code from CRM customer number
 *
 * @param crmCustomerNumber - CRM customer number (e.g., "100-1001", "100-1234")
 * @returns Siagh code (e.g., "1", "234") or undefined if invalid format
 *
 * @example
 * extractSiaghTmpId("100-1001") // "1" (subtract 1000 offset)
 * extractSiaghTmpId("100-1234") // "234" (subtract 1000 offset)
 * extractSiaghTmpId("100-5678") // "4678" (subtract 1000 offset)
 * extractSiaghTmpId(undefined) // undefined
 */
export function extractSiaghTmpId(crmCustomerNumber: string | undefined): string | undefined {
  if (!crmCustomerNumber) {
    return undefined;
  }

  // Check if the customer number contains a dash
  const dashIndex = crmCustomerNumber.indexOf('-');

  if (dashIndex === -1) {
    // No dash found, parse and subtract offset
    const numValue = parseInt(crmCustomerNumber, 10);
    if (isNaN(numValue)) {
      return undefined;
    }
    return Math.max(1, numValue - CUSTOMER_NUMBER_OFFSET).toString();
  }

  // Extract everything after the dash
  const valueAfterDash = crmCustomerNumber.substring(dashIndex + 1);

  if (!valueAfterDash) {
    return undefined;
  }

  // Parse the number and subtract the offset
  const numValue = parseInt(valueAfterDash, 10);
  if (isNaN(numValue)) {
    return undefined;
  }

  // Subtract offset (e.g., 1001 → 1, 1234 → 234)
  return Math.max(1, numValue - CUSTOMER_NUMBER_OFFSET).toString();
}

/**
 * Build CRM customer number from Siagh code
 *
 * @param siaghCode - Siagh code (e.g., "1", "234", "8389")
 * @returns CRM customer number (e.g., "100-1001", "100-1234", "100-9389") or undefined if code is invalid
 *
 * @example
 * buildCrmCustomerNumber("1") // "100-1001" (add 1000 offset)
 * buildCrmCustomerNumber("234") // "100-1234" (add 1000 offset)
 * buildCrmCustomerNumber("8389") // "100-9389" (add 1000 offset)
 * buildCrmCustomerNumber("100-1001") // "100-1001" (already has prefix)
 * buildCrmCustomerNumber(undefined) // undefined
 */
export function buildCrmCustomerNumber(siaghCode: string | undefined): string | undefined {
  if (!siaghCode) {
    return undefined;
  }

  // If it already starts with the prefix, return as is
  if (siaghCode.startsWith(CUSTOMER_NUMBER_PREFIX)) {
    return siaghCode;
  }

  // Parse the Siagh code
  const codeNum = parseInt(siaghCode, 10);
  if (isNaN(codeNum)) {
    return undefined;
  }

  // Add offset (e.g., 1 → 1001, 234 → 1234, 8389 → 9389)
  const crmNumber = codeNum + CUSTOMER_NUMBER_OFFSET;

  // Add the prefix
  return CUSTOMER_NUMBER_PREFIX + crmNumber;
}

/**
 * Check if a customer number is in the correct CRM format
 *
 * @param customerNumber - Customer number to check
 * @returns true if format is "100-{number}"
 *
 * @example
 * isCrmCustomerNumberFormat("100-1231") // true
 * isCrmCustomerNumberFormat("1231") // false
 */
export function isCrmCustomerNumberFormat(customerNumber: string | undefined): boolean {
  if (!customerNumber) {
    return false;
  }

  return customerNumber.startsWith(CUSTOMER_NUMBER_PREFIX) && customerNumber.length > CUSTOMER_NUMBER_PREFIX.length;
}
