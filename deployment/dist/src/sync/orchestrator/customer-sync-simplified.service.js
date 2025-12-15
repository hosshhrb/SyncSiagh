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
var CustomerSyncSimplifiedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSyncSimplifiedService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const crm_api_client_1 = require("../../crm/crm-api.client");
const finance_siagh_adapter_1 = require("../../finance/finance-siagh.adapter");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
const sync_log_repository_1 = require("../../database/repositories/sync-log.repository");
const loop_detector_service_1 = require("../strategy/loop-detector.service");
const checksum_util_1 = require("../../common/utils/checksum.util");
let CustomerSyncSimplifiedService = CustomerSyncSimplifiedService_1 = class CustomerSyncSimplifiedService {
    constructor(crmClient, siaghAdapter, entityMappingRepo, syncLogRepo, loopDetector) {
        this.crmClient = crmClient;
        this.siaghAdapter = siaghAdapter;
        this.entityMappingRepo = entityMappingRepo;
        this.syncLogRepo = syncLogRepo;
        this.loopDetector = loopDetector;
        this.logger = new common_1.Logger(CustomerSyncSimplifiedService_1.name);
    }
    async syncCustomerToFinance(crmCustomerId, triggerType, triggerPayload) {
        const transactionId = (0, uuid_1.v4)();
        this.logger.log(`🔄 Syncing customer from CRM to Finance: ${crmCustomerId}`);
        const isLoop = await this.loopDetector.isLoop(client_1.EntityType.CUSTOMER, crmCustomerId, 'CRM', transactionId);
        if (isLoop) {
            this.logger.warn(`⏭️  Loop detected, skipping`);
            return;
        }
        let syncLogId;
        let mapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.CUSTOMER, 'CRM', crmCustomerId);
        try {
            const crmCustomer = await this.crmClient.getCustomer(crmCustomerId);
            const crmChecksum = (0, checksum_util_1.generateChecksum)(crmCustomer);
            const customerNumber = crmCustomer.code;
            if (mapping &&
                (await this.loopDetector.isDataUnchanged(client_1.EntityType.CUSTOMER, crmCustomerId, 'CRM', crmChecksum))) {
                this.logger.log(`⏭️  No changes detected, skipping`);
                return;
            }
            const syncLog = await this.syncLogRepo.create({
                transactionId,
                entityMappingId: mapping?.id || 'pending',
                direction: 'CRM_TO_FINANCE',
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
                this.logger.log(`   Updating existing Finance customer: ${mapping.financeId}`);
                const financeCustomer = await this.siaghAdapter.getCustomer(mapping.financeId);
                const updateData = this.transformCrmToFinance(crmCustomer);
                const updatedCustomer = await this.siaghAdapter.updateCustomer(mapping.financeId, updateData, transactionId);
                const financeChecksum = (0, checksum_util_1.generateChecksum)(updatedCustomer);
                await this.entityMappingRepo.update(mapping.id, {
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmChecksum,
                    financeChecksum,
                    crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
                    financeUpdatedAt: new Date(),
                });
                await this.syncLogRepo.complete(syncLogId, {
                    status: client_1.SyncStatus.SUCCESS,
                    targetEntityId: mapping.financeId,
                    targetDataAfter: updatedCustomer,
                });
                this.logger.log(`✅ Updated Finance customer ${mapping.financeId}`);
            }
            else {
                if (customerNumber) {
                    try {
                        const existingCustomer = await this.siaghAdapter.getCustomer(customerNumber);
                        if (existingCustomer) {
                            this.logger.log(`   Found existing Finance customer by number: ${customerNumber}`);
                            mapping = await this.entityMappingRepo.create({
                                entityType: client_1.EntityType.CUSTOMER,
                                crmId: crmCustomerId,
                                financeId: customerNumber,
                                lastSyncSource: client_1.SystemType.CRM,
                                lastSyncTransactionId: transactionId,
                                crmChecksum,
                                financeChecksum: (0, checksum_util_1.generateChecksum)(existingCustomer),
                                crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
                                financeUpdatedAt: new Date(),
                            });
                            await this.syncLogRepo.complete(syncLogId, {
                                status: client_1.SyncStatus.SUCCESS,
                                targetEntityId: customerNumber,
                                targetDataAfter: existingCustomer,
                            });
                            this.logger.log(`✅ Linked existing Finance customer ${customerNumber}`);
                            return;
                        }
                    }
                    catch (error) {
                    }
                }
                this.logger.log(`   Creating new Finance customer`);
                const createData = this.transformCrmToFinance(crmCustomer);
                const newCustomer = await this.siaghAdapter.createCustomer(createData, transactionId);
                const financeChecksum = (0, checksum_util_1.generateChecksum)(newCustomer);
                mapping = await this.entityMappingRepo.create({
                    entityType: client_1.EntityType.CUSTOMER,
                    crmId: crmCustomerId,
                    financeId: newCustomer.id,
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmChecksum,
                    financeChecksum,
                    crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
                    financeUpdatedAt: new Date(),
                });
                await this.syncLogRepo.complete(syncLogId, {
                    status: client_1.SyncStatus.SUCCESS,
                    targetEntityId: newCustomer.id,
                    targetDataAfter: newCustomer,
                });
                this.logger.log(`✅ Created Finance customer ${newCustomer.id}`);
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
            customFields: {
                ...crmCustomer.customFields,
                customerNumber: crmCustomer.code,
            },
        };
    }
};
exports.CustomerSyncSimplifiedService = CustomerSyncSimplifiedService;
exports.CustomerSyncSimplifiedService = CustomerSyncSimplifiedService = CustomerSyncSimplifiedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_api_client_1.CrmApiClient,
        finance_siagh_adapter_1.FinanceSiaghAdapter,
        entity_mapping_repository_1.EntityMappingRepository,
        sync_log_repository_1.SyncLogRepository,
        loop_detector_service_1.LoopDetectorService])
], CustomerSyncSimplifiedService);
//# sourceMappingURL=customer-sync-simplified.service.js.map