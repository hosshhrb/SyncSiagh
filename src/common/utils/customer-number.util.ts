/**
 * Customer Number Utilities
 *
 * Handles conversion between CRM and Siagh customer number formats:
 * - CRM format: "100-1231" (full value with prefix)
 * - Siagh format: "1231" (value after dash, used as tmpid)
 */

const CUSTOMER_NUMBER_PREFIX = '100-';

/**
 * Extract Siagh tmpid from CRM customer number
 *
 * @param crmCustomerNumber - CRM customer number (e.g., "100-1231")
 * @returns Siagh tmpid (e.g., "1231") or undefined if invalid format
 *
 * @example
 * extractSiaghTmpId("100-1231") // "1231"
 * extractSiaghTmpId("1231") // "1231" (no dash, return as is)
 * extractSiaghTmpId(undefined) // undefined
 */
export function extractSiaghTmpId(crmCustomerNumber: string | undefined): string | undefined {
  if (!crmCustomerNumber) {
    return undefined;
  }

  // Check if the customer number contains a dash
  const dashIndex = crmCustomerNumber.indexOf('-');

  if (dashIndex === -1) {
    // No dash found, return the value as is
    return crmCustomerNumber;
  }

  // Extract everything after the dash
  const valueAfterDash = crmCustomerNumber.substring(dashIndex + 1);

  // Return the extracted value, or undefined if empty
  return valueAfterDash || undefined;
}

/**
 * Build CRM customer number from Siagh tmpid
 *
 * @param siaghTmpId - Siagh tmpid (e.g., "1231")
 * @returns CRM customer number (e.g., "100-1231") or undefined if tmpid is invalid
 *
 * @example
 * buildCrmCustomerNumber("1231") // "100-1231"
 * buildCrmCustomerNumber("100-1231") // "100-1231" (already has prefix)
 * buildCrmCustomerNumber(undefined) // undefined
 */
export function buildCrmCustomerNumber(siaghTmpId: string | undefined): string | undefined {
  if (!siaghTmpId) {
    return undefined;
  }

  // If it already starts with the prefix, return as is
  if (siaghTmpId.startsWith(CUSTOMER_NUMBER_PREFIX)) {
    return siaghTmpId;
  }

  // Add the prefix
  return CUSTOMER_NUMBER_PREFIX + siaghTmpId;
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
