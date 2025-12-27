"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSiaghTmpId = extractSiaghTmpId;
exports.buildCrmCustomerNumber = buildCrmCustomerNumber;
exports.isCrmCustomerNumberFormat = isCrmCustomerNumberFormat;
const CUSTOMER_NUMBER_PREFIX = '100-';
const CUSTOMER_NUMBER_OFFSET = 1000;
function extractSiaghTmpId(crmCustomerNumber) {
    if (!crmCustomerNumber) {
        return undefined;
    }
    const dashIndex = crmCustomerNumber.indexOf('-');
    if (dashIndex === -1) {
        const numValue = parseInt(crmCustomerNumber, 10);
        if (isNaN(numValue)) {
            return undefined;
        }
        return Math.max(1, numValue - CUSTOMER_NUMBER_OFFSET).toString();
    }
    const valueAfterDash = crmCustomerNumber.substring(dashIndex + 1);
    if (!valueAfterDash) {
        return undefined;
    }
    const numValue = parseInt(valueAfterDash, 10);
    if (isNaN(numValue)) {
        return undefined;
    }
    return Math.max(1, numValue - CUSTOMER_NUMBER_OFFSET).toString();
}
function buildCrmCustomerNumber(siaghCode) {
    if (!siaghCode) {
        return undefined;
    }
    if (siaghCode.startsWith(CUSTOMER_NUMBER_PREFIX)) {
        return siaghCode;
    }
    const codeNum = parseInt(siaghCode, 10);
    if (isNaN(codeNum)) {
        return undefined;
    }
    const crmNumber = codeNum + CUSTOMER_NUMBER_OFFSET;
    return CUSTOMER_NUMBER_PREFIX + crmNumber;
}
function isCrmCustomerNumberFormat(customerNumber) {
    if (!customerNumber) {
        return false;
    }
    return customerNumber.startsWith(CUSTOMER_NUMBER_PREFIX) && customerNumber.length > CUSTOMER_NUMBER_PREFIX.length;
}
//# sourceMappingURL=customer-number.util.js.map