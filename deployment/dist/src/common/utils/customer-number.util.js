"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSiaghTmpId = extractSiaghTmpId;
exports.buildCrmCustomerNumber = buildCrmCustomerNumber;
exports.isCrmCustomerNumberFormat = isCrmCustomerNumberFormat;
const CUSTOMER_NUMBER_PREFIX = '100-';
function extractSiaghTmpId(crmCustomerNumber) {
    if (!crmCustomerNumber) {
        return undefined;
    }
    const dashIndex = crmCustomerNumber.indexOf('-');
    if (dashIndex === -1) {
        return crmCustomerNumber;
    }
    const valueAfterDash = crmCustomerNumber.substring(dashIndex + 1);
    return valueAfterDash || undefined;
}
function buildCrmCustomerNumber(siaghTmpId) {
    if (!siaghTmpId) {
        return undefined;
    }
    if (siaghTmpId.startsWith(CUSTOMER_NUMBER_PREFIX)) {
        return siaghTmpId;
    }
    return CUSTOMER_NUMBER_PREFIX + siaghTmpId;
}
function isCrmCustomerNumberFormat(customerNumber) {
    if (!customerNumber) {
        return false;
    }
    return customerNumber.startsWith(CUSTOMER_NUMBER_PREFIX) && customerNumber.length > CUSTOMER_NUMBER_PREFIX.length;
}
//# sourceMappingURL=customer-number.util.js.map