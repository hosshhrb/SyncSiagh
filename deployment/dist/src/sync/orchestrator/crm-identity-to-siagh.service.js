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
var CrmIdentityToSiaghService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmIdentityToSiaghService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const crm_identity_api_client_1 = require("../../crm/crm-identity-api.client");
const siagh_api_client_1 = require("../../finance/siagh-api.client");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
const sync_log_repository_1 = require("../../database/repositories/sync-log.repository");
const customer_number_util_1 = require("../../common/utils/customer-number.util");
let CrmIdentityToSiaghService = CrmIdentityToSiaghService_1 = class CrmIdentityToSiaghService {
    constructor(crmIdentityClient, siaghClient, entityMappingRepo, syncLogRepo) {
        this.crmIdentityClient = crmIdentityClient;
        this.siaghClient = siaghClient;
        this.entityMappingRepo = entityMappingRepo;
        this.syncLogRepo = syncLogRepo;
        this.logger = new common_1.Logger(CrmIdentityToSiaghService_1.name);
    }
    async syncIdentity(identityId, identityType, triggerPayload) {
        const transactionId = (0, uuid_1.v4)();
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log('🔄 SYNCING IDENTITY: CRM → Siagh');
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log(`   Identity ID: ${identityId}`);
        this.logger.log(`   Type: ${identityType}`);
        this.logger.log(`   Transaction ID: ${transactionId}`);
        this.logger.log('');
        let syncLogId;
        let mapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.CUSTOMER, client_1.SystemType.CRM, identityId);
        try {
            this.logger.log('📥 Step 1: Fetching identity from CRM...');
            let crmIdentity;
            if (identityType === 'Person') {
                crmIdentity = await this.crmIdentityClient.getPerson(identityId);
            }
            else {
                crmIdentity = await this.crmIdentityClient.getOrganization(identityId);
            }
            this.logger.log(`   ✅ Retrieved: ${crmIdentity.nickName}`);
            this.logger.log(`   Customer Number (CRM): ${crmIdentity.customerNumber || 'N/A'}`);
            this.logger.log(`   Siagh tmpid: ${(0, customer_number_util_1.extractSiaghTmpId)(crmIdentity.customerNumber) || 'N/A'}`);
            this.logger.log('');
            this.logger.log('🔍 Step 2: Checking if exists in Siagh...');
            let siaghCode = null;
            const siaghTmpId = (0, customer_number_util_1.extractSiaghTmpId)(crmIdentity.customerNumber);
            if (mapping?.financeId) {
                siaghCode = mapping.financeId;
                this.logger.log(`   ✅ Found in mapping: CRM ID ${identityId} → Siagh Code ${siaghCode}`);
                this.logger.log(`   Siagh tmpid (will be sent): ${siaghTmpId || 'N/A'}`);
            }
            else {
                this.logger.log('   ℹ️  Not found in mapping - will create new');
                this.logger.log(`   Siagh tmpid (will be sent): ${siaghTmpId || 'N/A'}`);
            }
            this.logger.log('');
            this.logger.log('🔄 Step 3: Transforming to Siagh format...');
            const siaghData = this.transformCrmToSiagh(crmIdentity, identityType);
            this.logger.log(`   Name: ${siaghData.fullname}`);
            this.logger.log(`   Type: ${identityType} (tarafType: ${siaghData.taraftype})`);
            this.logger.log(`   Mobile: ${siaghData.mobileno || 'N/A'}`);
            this.logger.log(`   Email: ${siaghData.email || 'N/A'}`);
            this.logger.log('');
            const syncLog = await this.syncLogRepo.create({
                transactionId,
                entityMappingId: mapping?.id,
                direction: 'CRM_TO_FINANCE',
                status: 'IN_PROGRESS',
                triggerType: 'WEBHOOK',
                triggerPayload,
                sourceSystem: client_1.SystemType.CRM,
                targetSystem: client_1.SystemType.FINANCE,
                sourceEntityId: identityId,
                sourceData: crmIdentity,
            });
            syncLogId = syncLog.id;
            if (siaghCode) {
                this.logger.log(`📝 Step 4: Updating existing contact in Siagh (Code: ${siaghCode})...`);
                const updatedCode = await this.siaghClient.updateContact(siaghCode, siaghData);
                if (updatedCode !== siaghCode) {
                    this.logger.warn(`⚠️  WARNING: Siagh returned different code! Expected: ${siaghCode}, Got: ${updatedCode}`);
                    this.logger.warn(`   This indicates Siagh created a new record instead of updating.`);
                    this.logger.warn(`   Updating mapping to use new code: ${updatedCode}`);
                }
                if (mapping) {
                    await this.entityMappingRepo.update(mapping.id, {
                        financeId: updatedCode,
                        lastSyncSource: client_1.SystemType.CRM,
                        lastSyncTransactionId: transactionId,
                        crmUpdatedAt: new Date(),
                        financeUpdatedAt: new Date(),
                    });
                }
                else {
                    mapping = await this.entityMappingRepo.create({
                        entityType: client_1.EntityType.CUSTOMER,
                        crmId: identityId,
                        financeId: updatedCode,
                        lastSyncSource: client_1.SystemType.CRM,
                        lastSyncTransactionId: transactionId,
                        crmUpdatedAt: new Date(),
                        financeUpdatedAt: new Date(),
                    });
                }
                await this.syncLogRepo.complete(syncLogId, {
                    status: 'SUCCESS',
                    targetEntityId: updatedCode,
                });
                this.logger.log(`✅ Contact updated successfully (Code: ${updatedCode})`);
            }
            else {
                this.logger.log('📝 Step 4: Creating new contact in Siagh...');
                const newCode = await this.siaghClient.createContact(siaghData);
                mapping = await this.entityMappingRepo.create({
                    entityType: client_1.EntityType.CUSTOMER,
                    crmId: identityId,
                    financeId: newCode,
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmUpdatedAt: new Date(),
                    financeUpdatedAt: new Date(),
                });
                await this.syncLogRepo.complete(syncLogId, {
                    status: 'SUCCESS',
                    targetEntityId: newCode,
                });
                await this.syncLogRepo['prisma'].syncLog.update({
                    where: { id: syncLogId },
                    data: { entityMappingId: mapping.id },
                });
                this.logger.log(`✅ Contact created successfully (Code: ${newCode})`);
            }
            this.logger.log('═══════════════════════════════════════════════════════════════');
            this.logger.log('✅ SYNC COMPLETE');
            this.logger.log('═══════════════════════════════════════════════════════════════');
            this.logger.log('');
        }
        catch (error) {
            this.logger.error('═══════════════════════════════════════════════════════════════');
            this.logger.error('❌ SYNC FAILED');
            this.logger.error('═══════════════════════════════════════════════════════════════');
            this.logger.error(`   Error: ${error.message}`);
            this.logger.error('');
            if (syncLogId) {
                await this.syncLogRepo.complete(syncLogId, {
                    status: 'FAILED',
                    errorMessage: error.message,
                    errorStack: error.stack,
                });
            }
            throw error;
        }
    }
    transformCrmToSiagh(crmIdentity, identityType) {
        const mobilePhone = crmIdentity.phoneContacts?.find(p => p.phoneType?.toLowerCase().includes('mobile'));
        const officePhone = crmIdentity.phoneContacts?.find(p => p.phoneType?.toLowerCase().includes('office'));
        const primaryPhone = crmIdentity.phoneContacts?.[0];
        const primaryAddress = crmIdentity.addressContacts?.[0];
        const tarafType = identityType === 'Organization' ? 1 : 0;
        return {
            fullname: crmIdentity.nickName || '',
            mobileno: mobilePhone?.phoneNumber || undefined,
            telno: officePhone?.phoneNumber || primaryPhone?.phoneNumber || undefined,
            email: crmIdentity.email || undefined,
            websiteaddress: crmIdentity.website || undefined,
            address: primaryAddress?.address || undefined,
            codeshahr: primaryAddress?.city || undefined,
            codeostan: primaryAddress?.state || undefined,
            countrycode: primaryAddress?.country || undefined,
            pocode: primaryAddress?.zipCode || undefined,
            tozihat: crmIdentity.description || undefined,
            isactive: 1,
            tmpid: (0, customer_number_util_1.extractSiaghTmpId)(crmIdentity.customerNumber) || undefined,
            taraftype: tarafType,
        };
    }
};
exports.CrmIdentityToSiaghService = CrmIdentityToSiaghService;
exports.CrmIdentityToSiaghService = CrmIdentityToSiaghService = CrmIdentityToSiaghService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_identity_api_client_1.CrmIdentityApiClient,
        siagh_api_client_1.SiaghApiClient,
        entity_mapping_repository_1.EntityMappingRepository,
        sync_log_repository_1.SyncLogRepository])
], CrmIdentityToSiaghService);
//# sourceMappingURL=crm-identity-to-siagh.service.js.map