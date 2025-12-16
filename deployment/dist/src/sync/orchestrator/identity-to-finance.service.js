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
var IdentityToFinanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityToFinanceService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const crm_identity_api_client_1 = require("../../crm/crm-identity-api.client");
const finance_siagh_adapter_1 = require("../../finance/finance-siagh.adapter");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
const sync_log_repository_1 = require("../../database/repositories/sync-log.repository");
const loop_detector_service_1 = require("../strategy/loop-detector.service");
const checksum_util_1 = require("../../common/utils/checksum.util");
let IdentityToFinanceService = IdentityToFinanceService_1 = class IdentityToFinanceService {
    constructor(crmIdentityClient, siaghAdapter, entityMappingRepo, syncLogRepo, loopDetector) {
        this.crmIdentityClient = crmIdentityClient;
        this.siaghAdapter = siaghAdapter;
        this.entityMappingRepo = entityMappingRepo;
        this.syncLogRepo = syncLogRepo;
        this.loopDetector = loopDetector;
        this.logger = new common_1.Logger(IdentityToFinanceService_1.name);
    }
    async syncIdentityToFinance(identityId, identityType, triggerPayload) {
        const transactionId = (0, uuid_1.v4)();
        this.logger.log('🔄 ================== SYNCING IDENTITY TO FINANCE ==================');
        this.logger.log(`   Identity ID: ${identityId}`);
        this.logger.log(`   Identity Type: ${identityType}`);
        this.logger.log(`   Transaction ID: ${transactionId}`);
        const isLoop = await this.loopDetector.isLoop(client_1.EntityType.CUSTOMER, identityId, 'CRM', transactionId);
        if (isLoop) {
            this.logger.warn(`⏭️  Loop detected, skipping`);
            return;
        }
        let syncLogId;
        let mapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.CUSTOMER, 'CRM', identityId);
        try {
            this.logger.log('📥 Fetching identity from CRM...');
            let crmIdentity;
            let customerNumber;
            if (identityType === 'Person') {
                crmIdentity = await this.crmIdentityClient.getPerson(identityId);
                customerNumber = crmIdentity.customerNumber;
                this.logger.log(`   Person: ${crmIdentity.nickName}`);
            }
            else {
                crmIdentity = await this.crmIdentityClient.getOrganization(identityId);
                customerNumber = crmIdentity.customerNumber;
                this.logger.log(`   Organization: ${crmIdentity.nickName}`);
            }
            this.logger.log('📋 CRM Identity Data:');
            this.logger.log(JSON.stringify(crmIdentity, null, 2));
            const crmChecksum = (0, checksum_util_1.generateChecksum)(crmIdentity);
            if (mapping &&
                (await this.loopDetector.isDataUnchanged(client_1.EntityType.CUSTOMER, identityId, 'CRM', crmChecksum))) {
                this.logger.log(`⏭️  No changes detected, skipping`);
                return;
            }
            const syncLog = await this.syncLogRepo.create({
                transactionId,
                entityMappingId: mapping?.id || 'pending',
                direction: 'CRM_TO_FINANCE',
                status: client_1.SyncStatus.IN_PROGRESS,
                triggerType: 'WEBHOOK',
                triggerPayload,
                sourceSystem: client_1.SystemType.CRM,
                targetSystem: client_1.SystemType.FINANCE,
                sourceEntityId: identityId,
                sourceData: crmIdentity,
            });
            syncLogId = syncLog.id;
            this.logger.log('🔄 Transforming to Finance format...');
            const financeData = this.transformCrmToFinance(crmIdentity, identityType);
            this.logger.log('📋 Finance Data to Send:');
            this.logger.log(JSON.stringify(financeData, null, 2));
            if (mapping?.financeId) {
                this.logger.log(`   Updating existing Finance customer: ${mapping.financeId}`);
                const updatedCustomer = await this.siaghAdapter.updateCustomer(mapping.financeId, { ...financeData, id: mapping.financeId }, transactionId);
                const financeChecksum = (0, checksum_util_1.generateChecksum)(updatedCustomer);
                await this.entityMappingRepo.update(mapping.id, {
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmChecksum,
                    financeChecksum,
                    crmUpdatedAt: new Date(),
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
                        this.logger.log(`   Checking if customer exists in Finance by number: ${customerNumber}`);
                        const existingCustomer = await this.siaghAdapter.getCustomer(customerNumber);
                        if (existingCustomer) {
                            this.logger.log(`   Found existing Finance customer: ${customerNumber}`);
                            mapping = await this.entityMappingRepo.create({
                                entityType: client_1.EntityType.CUSTOMER,
                                crmId: identityId,
                                financeId: customerNumber,
                                lastSyncSource: client_1.SystemType.CRM,
                                lastSyncTransactionId: transactionId,
                                crmChecksum,
                                financeChecksum: (0, checksum_util_1.generateChecksum)(existingCustomer),
                                crmUpdatedAt: new Date(),
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
                        this.logger.debug(`   Customer not found in Finance, will create new`);
                    }
                }
                this.logger.log(`   Creating new Finance customer`);
                const newCustomer = await this.siaghAdapter.createCustomer(financeData, transactionId);
                const financeChecksum = (0, checksum_util_1.generateChecksum)(newCustomer);
                mapping = await this.entityMappingRepo.create({
                    entityType: client_1.EntityType.CUSTOMER,
                    crmId: identityId,
                    financeId: newCustomer.id,
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmChecksum,
                    financeChecksum,
                    crmUpdatedAt: new Date(),
                    financeUpdatedAt: new Date(),
                });
                await this.syncLogRepo.complete(syncLogId, {
                    status: client_1.SyncStatus.SUCCESS,
                    targetEntityId: newCustomer.id,
                    targetDataAfter: newCustomer,
                });
                this.logger.log(`✅ Created Finance customer ${newCustomer.id}`);
            }
            this.logger.log('========================================================================');
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
    transformCrmToFinance(crmIdentity, identityType) {
        const primaryPhone = crmIdentity.phoneContacts?.[0];
        const mobilePhone = crmIdentity.phoneContacts?.find((p) => p.phoneType?.toLowerCase().includes('mobile'));
        const officePhone = crmIdentity.phoneContacts?.find((p) => p.phoneType?.toLowerCase().includes('office'));
        const primaryAddress = crmIdentity.addressContacts?.[0];
        const financeData = {
            name: crmIdentity.nickName,
            phone: officePhone?.phoneNumber || primaryPhone?.phoneNumber,
            mobile: mobilePhone?.phoneNumber,
            email: crmIdentity.email,
            address: primaryAddress?.address,
            city: primaryAddress?.city,
            state: primaryAddress?.state,
            country: primaryAddress?.country,
            postalCode: primaryAddress?.zipCode,
            nationalCode: crmIdentity.nationalCode,
            economicCode: crmIdentity.economicCode,
            notes: crmIdentity.description,
        };
        if (identityType === 'Person') {
            const person = crmIdentity;
            financeData.firstName = person.firstName;
            financeData.lastName = person.lastName;
        }
        else {
            const org = crmIdentity;
            financeData.companyName = crmIdentity.nickName;
            financeData.registrationNumber = org.registerNumber;
        }
        return financeData;
    }
};
exports.IdentityToFinanceService = IdentityToFinanceService;
exports.IdentityToFinanceService = IdentityToFinanceService = IdentityToFinanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_identity_api_client_1.CrmIdentityApiClient,
        finance_siagh_adapter_1.FinanceSiaghAdapter,
        entity_mapping_repository_1.EntityMappingRepository,
        sync_log_repository_1.SyncLogRepository,
        loop_detector_service_1.LoopDetectorService])
], IdentityToFinanceService);
//# sourceMappingURL=identity-to-finance.service.js.map