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
        return parseInt(crmCustomerNumber, 10).toString();
    }
    const valueAfterDash = crmCustomerNumber.substring(dashIndex + 1);
    if (!valueAfterDash) {
        return undefined;
    }
    return parseInt(valueAfterDash, 10).toString();
}
function buildCrmCustomerNumber(siaghCode) {
    if (!siaghCode) {
        return undefined;
    }
    if (siaghCode.startsWith(CUSTOMER_NUMBER_PREFIX)) {
        return siaghCode;
    }
    const paddedCode = siaghCode.padStart(4, '0');
    return CUSTOMER_NUMBER_PREFIX + paddedCode;
}
function isCrmCustomerNumberFormat(customerNumber) {
    if (!customerNumber) {
        return false;
    }
    return customerNumber.startsWith(CUSTOMER_NUMBER_PREFIX) && customerNumber.length > CUSTOMER_NUMBER_PREFIX.length;
}
//# sourceMappingURL=customer-number.util.js.map