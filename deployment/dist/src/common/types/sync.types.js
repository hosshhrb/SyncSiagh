"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncStatus = exports.EntityType = exports.SystemType = void 0;
var SystemType;
(function (SystemType) {
    SystemType["CRM"] = "CRM";
    SystemType["FINANCE"] = "FINANCE";
})(SystemType || (exports.SystemType = SystemType = {}));
var EntityType;
(function (EntityType) {
    EntityType["CUSTOMER"] = "CUSTOMER";
    EntityType["PREINVOICE"] = "PREINVOICE";
})(EntityType || (exports.EntityType = EntityType = {}));
var SyncStatus;
(function (SyncStatus) {
    SyncStatus["PENDING"] = "PENDING";
    SyncStatus["IN_PROGRESS"] = "IN_PROGRESS";
    SyncStatus["SUCCESS"] = "SUCCESS";
    SyncStatus["FAILED"] = "FAILED";
    SyncStatus["CONFLICT"] = "CONFLICT";
})(SyncStatus || (exports.SyncStatus = SyncStatus = {}));
//# sourceMappingURL=sync.types.js.map