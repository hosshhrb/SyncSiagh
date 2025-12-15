"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LoopDetectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopDetectorService = void 0;
const common_1 = require("@nestjs/common");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
let LoopDetectorService = LoopDetectorService_1 = class LoopDetectorService {
    constructor(entityMappingRepo) {
        this.entityMappingRepo = entityMappingRepo;
        this.logger = new common_1.Logger(LoopDetectorService_1.name);
    }
    async isLoop(entityType, entityId, systemType, currentTransactionId) {
        const mapping = await this.entityMappingRepo.findByEntityId(entityType, systemType, entityId);
        if (!mapping) {
            return false;
        }
        if (mapping.lastSyncTransactionId === currentTransactionId) {
            this.logger.warn(`🔄 Loop detected: Transaction ${currentTransactionId} already synced this entity`);
            return true;
        }
        const lastSyncTime = mapping.lastSyncAt.getTime();
        const timeSinceSync = Date.now() - lastSyncTime;
        const tenSecondsInMs = 10000;
        if (timeSinceSync < tenSecondsInMs) {
            this.logger.warn(`🔄 Potential loop detected: Entity was synced ${timeSinceSync}ms ago, skipping`);
            return true;
        }
        return false;
    }
    async isDataUnchanged(entityType, entityId, systemType, newChecksum) {
        const mapping = await this.entityMappingRepo.findByEntityId(entityType, systemType, entityId);
        if (!mapping) {
            return false;
        }
        const storedChecksum = systemType === 'CRM' ? mapping.crmChecksum : mapping.financeChecksum;
        if (storedChecksum === newChecksum) {
            this.logger.log(`✓ Data unchanged (checksum match), skipping sync`);
            return true;
        }
        return false;
    }
};
exports.LoopDetectorService = LoopDetectorService;
exports.LoopDetectorService = LoopDetectorService = LoopDetectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [entity_mapping_repository_1.EntityMappingRepository])
], LoopDetectorService);
//# sourceMappingURL=loop-detector.service.js.map