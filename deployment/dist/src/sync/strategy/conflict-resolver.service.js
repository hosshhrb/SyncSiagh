"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ConflictResolverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictResolverService = void 0;
const common_1 = require("@nestjs/common");
let ConflictResolverService = ConflictResolverService_1 = class ConflictResolverService {
    constructor() {
        this.logger = new common_1.Logger(ConflictResolverService_1.name);
    }
    resolve(input) {
        const { sourceSystem, targetSystem } = input;
        if (sourceSystem === 'CRM') {
            this.logger.log(`✅ CRM is source, syncing to ${targetSystem} (CRM always wins)`);
            return {
                shouldSync: true,
                winner: 'source',
                reason: 'CRM priority - CRM always wins conflicts',
            };
        }
        if (sourceSystem === 'FINANCE' && targetSystem === 'CRM') {
            this.logger.log(`⏭️ Finance → CRM sync attempted, but CRM has priority. Skipping.`);
            return {
                shouldSync: false,
                winner: 'target',
                reason: 'CRM priority - Finance changes don\'t override CRM',
            };
        }
        return {
            shouldSync: true,
            winner: 'source',
            reason: 'No conflict detected',
        };
    }
    shouldSyncBasedOnTime(lastSyncAt, minIntervalMinutes) {
        const now = Date.now();
        const lastSync = new Date(lastSyncAt).getTime();
        const intervalMs = minIntervalMinutes * 60 * 1000;
        return now - lastSync >= intervalMs;
    }
};
exports.ConflictResolverService = ConflictResolverService;
exports.ConflictResolverService = ConflictResolverService = ConflictResolverService_1 = __decorate([
    (0, common_1.Injectable)()
], ConflictResolverService);
//# sourceMappingURL=conflict-resolver.service.js.map