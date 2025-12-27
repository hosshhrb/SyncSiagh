/**
 * Customer Number Utilities
 *
 * Handles conversion between CRM and Siagh customer number formats:
 * - CRM format: "100-1231" (full value with prefix)
 * - Siagh format: "1231" (value after dash, used as tmpid)
 */

const CUSTOMER_NUMBER_PREFIX = '100-';

/**
 * Extract Siagh code from CRM customer number
 *
 * @param crmCustomerNumber - CRM customer number (e.g., "100-0003", "100-1231")
 * @returns Siagh code (e.g., "3", "1231") or undefined if invalid format
 *
 * @example
 * extractSiaghTmpId("100-0003") // "3" (leading zeros removed)
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
    // No dash found, remove leading zeros and return
    return parseInt(crmCustomerNumber, 10).toString();
  }

  // Extract everything after the dash
  const valueAfterDash = crmCustomerNumber.substring(dashIndex + 1);

  if (!valueAfterDash) {
    return undefined;
  }

  // Remove leading zeros by converting to number and back to string
  return parseInt(valueAfterDash, 10).toString();
}

/**
 * Build CRM customer number from Siagh code
 *
 * @param siaghCode - Siagh code (e.g., "3", "123", "1231")
 * @returns CRM customer number (e.g., "100-0003", "100-0123", "100-1231") or undefined if code is invalid
 *
 * @example
 * buildCrmCustomerNumber("3") // "100-0003" (padded to 4 digits)
 * buildCrmCustomerNumber("45") // "100-0045" (padded to 4 digits)
 * buildCrmCustomerNumber("123") // "100-0123" (padded to 4 digits)
 * buildCrmCustomerNumber("1231") // "100-1231"
 * buildCrmCustomerNumber("100-0003") // "100-0003" (already has prefix)
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

  // Pad the code to at least 4 digits with leading zeros
  const paddedCode = siaghCode.padStart(4, '0');

  // Add the prefix
  return CUSTOMER_NUMBER_PREFIX + paddedCode;
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
