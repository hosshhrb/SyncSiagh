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
var CustomerSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSyncService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const crm_api_client_1 = require("../../crm/crm-api.client");
const finance_api_client_1 = require("../../finance/finance-api.client");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
const sync_log_repository_1 = require("../../database/repositories/sync-log.repository");
const conflict_resolver_service_1 = require("../strategy/conflict-resolver.service");
const loop_detector_service_1 = require("../strategy/loop-detector.service");
const checksum_util_1 = require("../../common/utils/checksum.util");
let CustomerSyncService = CustomerSyncService_1 = class CustomerSyncService {
    constructor(crmClient, financeClient, entityMappingRepo, syncLogRepo, conflictResolver, loopDetector) {
        this.crmClient = crmClient;
        this.financeClient = financeClient;
        this.entityMappingRepo = entityMappingRepo;
        this.syncLogRepo = syncLogRepo;
        this.conflictResolver = conflictResolver;
        this.loopDetector = loopDetector;
        this.logger = new common_1.Logger(CustomerSyncService_1.name);
    }
    async syncFromCrmToFinance(crmCustomerId, triggerType, triggerPayload) {
        const transactionId = (0, uuid_1.v4)();
        const direction = 'CRM_TO_FINANCE';
        this.logger.log(`🔄 Starting sync: CRM -> Finance | Customer ${crmCustomerId}`);
        const isLoop = await this.loopDetector.isLoop(client_1.EntityType.CUSTOMER, crmCustomerId, 'CRM', transactionId);
        if (isLoop) {
            this.logger.warn(`⏭️ Skipping sync due to loop detection`);
            return;
        }
        let syncLogId;
        let mapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.CUSTOMER, 'CRM', crmCustomerId);
        try {
            const crmCustomer = await this.crmClient.getCustomer(crmCustomerId);
            const crmChecksum = (0, checksum_util_1.generateChecksum)(crmCustomer);
            if (mapping &&
                (await this.loopDetector.isDataUnchanged(client_1.EntityType.CUSTOMER, crmCustomerId, 'CRM', crmChecksum))) {
                this.logger.log(`⏭️ Skipping sync - data unchanged`);
                return;
            }
            const syncLog = await this.syncLogRepo.create({
                transactionId,
                entityMappingId: mapping?.id || 'pending',
                direction,
                status: client_1.SyncStatus.IN_PROGRESS,
                triggerType,
                triggerPayload,
                sourceSystem: client_1.SystemType.CRM,
                targetSystem: client_1.SystemType.FINANCE,
                sourceEntityId: crmCustomerId,
                sourceData: crmCustomer,
            });
            syncLogId = syncLog.id;
            if (mapping?.financeId) {
                const financeCustomer = await this.financeClient.getCustomer(mapping.financeId);
                const resolution = this.conflictResolver.resolve({
                    sourceUpdatedAt: crmCustomer.updatedAt || crmCustomer.createdAt || new Date(),
                    targetUpdatedAt: financeCustomer.updatedAt || financeCustomer.createdAt || new Date(),
                    sourceSystem: 'CRM',
                    targetSystem: 'Finance',
                });
                if (!resolution.shouldSync) {
                    await this.syncLogRepo.complete(syncLogId, {
                        status: client_1.SyncStatus.CONFLICT,
                        errorMessage: resolution.reason,
                    });
                    this.logger.warn(`⚠️ Conflict: ${resolution.reason}`);
                    return;
                }
                const updateData = this.transformCrmToFinance(crmCustomer);
                const updatedFinanceCustomer = await this.financeClient.updateCustomer(mapping.financeId, { ...updateData, id: mapping.financeId }, transactionId);
                const financeChecksum = (0, checksum_util_1.generateChecksum)(updatedFinanceCustomer);
                await this.entityMappingRepo.update(mapping.id, {
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmChecksum,
                    financeChecksum,
                    crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
                    financeUpdatedAt: new Date(updatedFinanceCustomer.updatedAt || updatedFinanceCustomer.createdAt || new Date()),
                });
                await this.syncLogRepo.complete(syncLogId, {
                    status: client_1.SyncStatus.SUCCESS,
                    targetEntityId: mapping.financeId,
                    targetDataAfter: updatedFinanceCustomer,
                });
                this.logger.log(`✅ Successfully updated Finance customer ${mapping.financeId}`);
            }
            else {
                const createData = this.transformCrmToFinance(crmCustomer);
                const newFinanceCustomer = await this.financeClient.createCustomer(createData, transactionId);
                const financeChecksum = (0, checksum_util_1.generateChecksum)(newFinanceCustomer);
                if (mapping) {
                    await this.entityMappingRepo.update(mapping.id, {
                        financeId: newFinanceCustomer.id,
                        lastSyncSource: client_1.SystemType.CRM,
                        lastSyncTransactionId: transactionId,
                        crmChecksum,
                        financeChecksum,
                        crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
                        financeUpdatedAt: new Date(newFinanceCustomer.updatedAt || newFinanceCustomer.createdAt || new Date()),
                    });
                }
                else {
                    mapping = await this.entityMappingRepo.create({
                        entityType: client_1.EntityType.CUSTOMER,
                        crmId: crmCustomerId,
                        financeId: newFinanceCustomer.id,
                        lastSyncSource: client_1.SystemType.CRM,
                        lastSyncTransactionId: transactionId,
                        crmChecksum,
                        financeChecksum,
                        crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
                        financeUpdatedAt: new Date(newFinanceCustomer.updatedAt || newFinanceCustomer.createdAt || new Date()),
                    });
                    await this.syncLogRepo.complete(syncLogId, {
                        status: client_1.SyncStatus.IN_PROGRESS,
                    });
                }
                await this.syncLogRepo.complete(syncLogId, {
                    status: client_1.SyncStatus.SUCCESS,
                    targetEntityId: newFinanceCustomer.id,
                    targetDataAfter: newFinanceCustomer,
                });
                this.logger.log(`✅ Successfully created Finance customer ${newFinanceCustomer.id}`);
            }
        }
        catch (error) {
            this.logger.error(`❌ Sync failed: ${error.message}`, error.stack);
            if (syncLogId) {
                await this.syncLogRepo.complete(syncLogId, {
                    status: client_1.SyncStatus.FAILED,
                    errorMessage: error.message,
                    errorStack: error.stack,
                });
            }
            throw error;
        }
    }
    async syncFromFinanceToCrm(financeCustomerId, triggerType, triggerPayload) {
        const transactionId = (0, uuid_1.v4)();
        const direction = 'FINANCE_TO_CRM';
        this.logger.log(`🔄 Starting sync: Finance -> CRM | Customer ${financeCustomerId}`);
        const isLoop = await this.loopDetector.isLoop(client_1.EntityType.CUSTOMER, financeCustomerId, 'FINANCE', transactionId);
        if (isLoop) {
            this.logger.warn(`⏭️ Skipping sync due to loop detection`);
            return;
        }
        let syncLogId;
        let mapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.CUSTOMER, 'FINANCE', financeCustomerId);
        try {
            const financeCustomer = await this.financeClient.getCustomer(financeCustomerId);
            const financeChecksum = (0, checksum_util_1.generateChecksum)(financeCustomer);
            if (mapping &&
                (await this.loopDetector.isDataUnchanged(client_1.EntityType.CUSTOMER, financeCustomerId, 'FINANCE', financeChecksum))) {
                this.logger.log(`⏭️ Skipping sync - data unchanged`);
                return;
            }
            const syncLog = await this.syncLogRepo.create({
                transactionId,
                entityMappingId: mapping?.id || 'pending',
                direction,
                status: client_1.SyncStatus.IN_PROGRESS,
                triggerType,
                triggerPayload,
                sourceSystem: client_1.SystemType.FINANCE,
                targetSystem: client_1.SystemType.CRM,
                sourceEntityId: financeCustomerId,
                sourceData: financeCustomer,
            });
            syncLogId = syncLog.id;
            if (mapping?.crmId) {
                const crmCustomer = await this.crmClient.getCustomer(mapping.crmId);
                const resolution = this.conflictResolver.resolve({
                    sourceUpdatedAt: financeCustomer.updatedAt || financeCustomer.createdAt || new Date(),
                    targetUpdatedAt: crmCustomer.updatedAt || crmCustomer.createdAt || new Date(),
                    sourceSystem: 'Finance',
                    targetSystem: 'CRM',
                });
                if (!resolution.shouldSync) {
                    await this.syncLogRepo.complete(syncLogId, {
                        status: client_1.SyncStatus.CONFLICT,
                        errorMessage: resolution.reason,
                    });
                    this.logger.warn(`⚠️ Conflict: ${resolution.reason}`);
                    return;
                }
                const updateData = this.transformFinanceToCrm(financeCustomer);
                const updatedCrmCustomer = await this.crmClient.updateCustomer(mapping.crmId, {
                    ...updateData,
                    id: mapping.crmId,
                });
                const crmChecksum = (0, checksum_util_1.generateChecksum)(updatedCrmCustomer);
                await this.entityMappingRepo.update(mapping.id, {
                    lastSyncSource: client_1.SystemType.FINANCE,
                    lastSyncTransactionId: transactionId,
                    crmChecksum,
                    financeChecksum,
                    crmUpdatedAt: new Date(updatedCrmCustomer.updatedAt || updatedCrmCustomer.createdAt || new Date()),
                    financeUpdatedAt: new Date(financeCustomer.updatedAt || financeCustomer.createdAt || new Date()),
                });
                await this.syncLogRepo.complete(syncLogId, {
                    status: client_1.SyncStatus.SUCCESS,
                    targetEntityId: mapping.crmId,
                    targetDataAfter: updatedCrmCustomer,
                });
                this.logger.log(`✅ Successfully updated CRM customer ${mapping.crmId}`);
            }
            else {
                const createData = this.transformFinanceToCrm(financeCustomer);
                const newCrmCustomer = await this.crmClient.createCustomer(createData);
                const crmChecksum = (0, checksum_util_1.generateChecksum)(newCrmCustomer);
                if (mapping) {
                    await this.entityMappingRepo.update(mapping.id, {
                        crmId: newCrmCustomer.id,
                        lastSyncSource: client_1.SystemType.FINANCE,
                        lastSyncTransactionId: transactionId,
                        crmChecksum,
                        financeChecksum,
                        crmUpdatedAt: new Date(newCrmCustomer.updatedAt || newCrmCustomer.createdAt || new Date()),
                        financeUpdatedAt: new Date(financeCustomer.updatedAt || financeCustomer.createdAt || new Date()),
                    });
                }
                else {
                    mapping = await this.entityMappingRepo.create({
                        entityType: client_1.EntityType.CUSTOMER,
                        crmId: newCrmCustomer.id,
                        financeId: financeCustomerId,
                        lastSyncSource: client_1.SystemType.FINANCE,
                        lastSyncTransactionId: transactionId,
                        crmChecksum,
                        financeChecksum,
                        crmUpdatedAt: new Date(newCrmCustomer.updatedAt || newCrmCustomer.createdAt || new Date()),
                        financeUpdatedAt: new Date(financeCustomer.updatedAt || financeCustomer.createdAt || new Date()),
                    });
                }
                await this.syncLogRepo.complete(syncLogId, {
                    status: client_1.SyncStatus.SUCCESS,
                    targetEntityId: newCrmCustomer.id,
                    targetDataAfter: newCrmCustomer,
                });
                this.logger.log(`✅ Successfully created CRM customer ${newCrmCustomer.id}`);
            }
        }
        catch (error) {
            this.logger.error(`❌ Sync failed: ${error.message}`, error.stack);
            if (syncLogId) {
                await this.syncLogRepo.complete(syncLogId, {
                    status: client_1.SyncStatus.FAILED,
                    errorMessage: error.message,
                    errorStack: error.stack,
                });
            }
            throw error;
        }
    }
    transformCrmToFinance(crmCustomer) {
        return {
            name: crmCustomer.name,
            firstName: crmCustomer.firstName,
            lastName: crmCustomer.lastName,
            companyName: crmCustomer.companyName,
            phone: crmCustomer.phone,
            mobile: crmCustomer.mobile,
            email: crmCustomer.email,
            address: crmCustomer.address,
            city: crmCustomer.city,
            state: crmCustomer.state,
            country: crmCustomer.country,
            postalCode: crmCustomer.postalCode,
            nationalCode: crmCustomer.nationalCode,
            economicCode: crmCustomer.economicCode,
            registrationNumber: crmCustomer.registrationNumber,
            taxCode: crmCustomer.taxCode,
            customerType: crmCustomer.customerType,
            notes: crmCustomer.description,
            customFields: crmCustomer.customFields,
        };
    }
    transformFinanceToCrm(financeCustomer) {
        return {
            name: financeCustomer.name,
            firstName: financeCustomer.firstName,
            lastName: financeCustomer.lastName,
            companyName: financeCustomer.companyName,
            phone: financeCustomer.phone,
            mobile: financeCustomer.mobile,
            email: financeCustomer.email,
            address: financeCustomer.address,
            city: financeCustomer.city,
            state: financeCustomer.state,
            country: financeCustomer.country,
            postalCode: financeCustomer.postalCode,
            nationalCode: financeCustomer.nationalCode,
            economicCode: financeCustomer.economicCode,
            registrationNumber: financeCustomer.registrationNumber,
            taxCode: financeCustomer.taxCode,
            customerType: financeCustomer.customerType,
            description: financeCustomer.notes,
            customFields: financeCustomer.customFields,
        };
    }
};
exports.CustomerSyncService = CustomerSyncService;
exports.CustomerSyncService = CustomerSyncService = CustomerSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_api_client_1.CrmApiClient,
        finance_api_client_1.FinanceApiClient,
        entity_mapping_repository_1.EntityMappingRepository,
        sync_log_repository_1.SyncLogRepository,
        conflict_resolver_service_1.ConflictResolverService,
        loop_detector_service_1.LoopDetectorService])
], CustomerSyncService);
//# sourceMappingURL=customer-sync.service.js.map