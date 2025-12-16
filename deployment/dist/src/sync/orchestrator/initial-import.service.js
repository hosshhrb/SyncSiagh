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
var InitialImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialImportService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const siagh_api_client_1 = require("../../finance/siagh-api.client");
const crm_identity_api_client_1 = require("../../crm/crm-identity-api.client");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
let InitialImportService = InitialImportService_1 = class InitialImportService {
    constructor(siaghClient, crmIdentityClient, entityMappingRepo) {
        this.siaghClient = siaghClient;
        this.crmIdentityClient = crmIdentityClient;
        this.entityMappingRepo = entityMappingRepo;
        this.logger = new common_1.Logger(InitialImportService_1.name);
        this.BATCH_SIZE = 10;
    }
    async runInitialImport() {
        const startTime = Date.now();
        this.logger.log('');
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log('   INITIAL IMPORT: Siagh Finance → CRM (Payamgostar)');
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log('');
        const result = {
            total: 0,
            imported: 0,
            skipped: 0,
            errors: 0,
            details: [],
        };
        try {
            this.logger.log('📥 STEP 1: Fetching data from both systems (parallel)...');
            const [siaghUsers, crmIdentities, existingMappings] = await Promise.all([
                this.siaghClient.getAllUsers(),
                this.crmIdentityClient.searchAllIdentities(),
                this.entityMappingRepo.findAll(client_1.EntityType.CUSTOMER),
            ]);
            this.logger.log(`   ✅ Siagh users: ${siaghUsers.length}`);
            this.logger.log(`   ✅ CRM identities: ${crmIdentities.length}`);
            this.logger.log(`   ✅ Existing mappings: ${existingMappings.length}`);
            this.logger.log('');
            result.total = siaghUsers.length;
            this.logger.log('🔍 STEP 2: Building lookup indexes...');
            const crmIdentityIds = new Set(crmIdentities.map(i => i.identityId));
            const mappedRecordIds = new Set(existingMappings.map(m => m.financeId));
            const crmByNickName = new Map();
            for (const identity of crmIdentities) {
                if (identity.nickName) {
                    crmByNickName.set(identity.nickName.toLowerCase().trim(), identity);
                }
            }
            this.logger.log(`   ✅ CRM identity lookup: ${crmIdentityIds.size} entries`);
            this.logger.log(`   ✅ Mapped records lookup: ${mappedRecordIds.size} entries`);
            this.logger.log(`   ✅ CRM nickName lookup: ${crmByNickName.size} entries`);
            this.logger.log('');
            this.logger.log('🔄 STEP 3: Identifying new records to import...');
            const toImport = [];
            const skipped = [];
            for (const user of siaghUsers) {
                if (mappedRecordIds.has(user.RecordId)) {
                    skipped.push({ user, reason: 'Already mapped (RecordId exists in mappings)' });
                    continue;
                }
                const existingByName = crmByNickName.get(user.Name?.toLowerCase().trim() || '');
                if (existingByName) {
                    skipped.push({ user, reason: `Duplicate name in CRM (${existingByName.identityId})` });
                    continue;
                }
                if (!user.IsActive) {
                    skipped.push({ user, reason: 'Inactive user' });
                    continue;
                }
                if (user.IsAdminUser) {
                    skipped.push({ user, reason: 'Admin user' });
                    continue;
                }
                toImport.push(user);
            }
            this.logger.log(`   ✅ To import: ${toImport.length}`);
            this.logger.log(`   ⏭️  Skipped: ${skipped.length}`);
            if (skipped.length > 0) {
                this.logger.log('');
                this.logger.log('   Skipped records:');
                for (const { user, reason } of skipped.slice(0, 10)) {
                    this.logger.log(`      - ${user.Name || user.RecordId}: ${reason}`);
                    result.details.push({
                        recordId: user.RecordId,
                        name: user.Name || 'Unknown',
                        type: user.TowardType ? 'Organization' : 'Person',
                        status: 'skipped',
                        reason,
                    });
                }
                if (skipped.length > 10) {
                    this.logger.log(`      ... and ${skipped.length - 10} more`);
                }
            }
            result.skipped = skipped.length;
            this.logger.log('');
            if (toImport.length === 0) {
                this.logger.log('✅ No new records to import. All users are already synced!');
                return result;
            }
            this.logger.log(`🚀 STEP 4: Importing ${toImport.length} records to CRM (batch size: ${this.BATCH_SIZE})...`);
            this.logger.log('');
            for (let i = 0; i < toImport.length; i += this.BATCH_SIZE) {
                const batch = toImport.slice(i, i + this.BATCH_SIZE);
                const batchNum = Math.floor(i / this.BATCH_SIZE) + 1;
                const totalBatches = Math.ceil(toImport.length / this.BATCH_SIZE);
                this.logger.log(`   📦 Batch ${batchNum}/${totalBatches} (${batch.length} records)...`);
                const batchResults = await Promise.allSettled(batch.map(user => this.importSingleUser(user)));
                for (let j = 0; j < batchResults.length; j++) {
                    const batchResult = batchResults[j];
                    const user = batch[j];
                    if (batchResult.status === 'fulfilled') {
                        result.imported++;
                        result.details.push(batchResult.value);
                        this.logger.log(`      ✅ ${user.Name} → ${batchResult.value.crmId}`);
                    }
                    else {
                        result.errors++;
                        result.details.push({
                            recordId: user.RecordId,
                            name: user.Name || 'Unknown',
                            type: user.TowardType ? 'Organization' : 'Person',
                            status: 'error',
                            reason: batchResult.reason?.message || 'Unknown error',
                        });
                        this.logger.error(`      ❌ ${user.Name}: ${batchResult.reason?.message}`);
                    }
                }
            }
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            this.logger.log('');
            this.logger.log('═══════════════════════════════════════════════════════════════');
            this.logger.log('   IMPORT COMPLETE');
            this.logger.log('═══════════════════════════════════════════════════════════════');
            this.logger.log(`   📊 Total records: ${result.total}`);
            this.logger.log(`   ✅ Imported: ${result.imported}`);
            this.logger.log(`   ⏭️  Skipped: ${result.skipped}`);
            this.logger.log(`   ❌ Errors: ${result.errors}`);
            this.logger.log(`   ⏱️  Duration: ${duration}s`);
            this.logger.log('═══════════════════════════════════════════════════════════════');
            this.logger.log('');
            return result;
        }
        catch (error) {
            this.logger.error('❌ Import failed!', error.stack);
            throw error;
        }
    }
    async importSingleUser(user) {
        const isOrganization = user.TowardType === true;
        const type = isOrganization ? 'Organization' : 'Person';
        try {
            let crmId;
            if (isOrganization) {
                const orgData = this.transformToOrganization(user);
                const response = await this.crmIdentityClient.createOrganization(orgData);
                crmId = response.id;
            }
            else {
                const personData = this.transformToPerson(user);
                const response = await this.crmIdentityClient.createPerson(personData);
                crmId = response.id;
            }
            await this.entityMappingRepo.create({
                entityType: client_1.EntityType.CUSTOMER,
                crmId: crmId,
                financeId: user.RecordId,
                lastSyncSource: client_1.SystemType.FINANCE,
                lastSyncTransactionId: `initial-import-${Date.now()}`,
                crmChecksum: '',
                financeChecksum: '',
                crmUpdatedAt: new Date(),
                financeUpdatedAt: new Date(),
            });
            return {
                recordId: user.RecordId,
                name: user.Name || 'Unknown',
                type,
                status: 'imported',
                crmId,
            };
        }
        catch (error) {
            throw error;
        }
    }
    transformToPerson(user) {
        const nameParts = (user.Name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const phoneContacts = [];
        if (user.MobileNo) {
            phoneContacts.push({
                default: true,
                phoneType: 'Mobile',
                phoneNumber: user.MobileNo,
            });
        }
        if (user.MobileNo2) {
            phoneContacts.push({
                phoneType: 'Mobile',
                phoneNumber: user.MobileNo2,
            });
        }
        if (user.TelNo) {
            phoneContacts.push({
                phoneType: 'Office',
                phoneNumber: user.TelNo,
            });
        }
        const addressContacts = [];
        if (user.Address || user.PostalCode) {
            addressContacts.push({
                default: true,
                address: user.Address || '',
                zipCode: user.PostalCode || '',
            });
        }
        return {
            refId: user.RecordId,
            nickName: user.Name || '',
            firstName,
            lastName,
            nationalCode: user.NationalCode || '',
            email: user.Email || '',
            alternativeEmail: user.Email2 || '',
            website: user.WebSiteAddress || '',
            description: user.Description || `Imported from Siagh (Code: ${user.Code})`,
            phoneContacts: phoneContacts.length > 0 ? phoneContacts : undefined,
            addressContacts: addressContacts.length > 0 ? addressContacts : undefined,
            customerNumber: user.Code?.toString(),
            gender: user.Gender || undefined,
        };
    }
    transformToOrganization(user) {
        const phoneContacts = [];
        if (user.MobileNo) {
            phoneContacts.push({
                default: true,
                phoneType: 'Mobile',
                phoneNumber: user.MobileNo,
            });
        }
        if (user.TelNo) {
            phoneContacts.push({
                phoneType: 'Office',
                phoneNumber: user.TelNo,
            });
        }
        const addressContacts = [];
        if (user.Address || user.PostalCode) {
            addressContacts.push({
                default: true,
                address: user.Address || '',
                zipCode: user.PostalCode || '',
            });
        }
        return {
            refId: user.RecordId,
            nickName: user.Name || '',
            nationalCode: user.NationalCode || '',
            email: user.Email || '',
            alternativeEmail: user.Email2 || '',
            website: user.WebSiteAddress || '',
            description: user.Description || `Imported from Siagh (Code: ${user.Code})`,
            phoneContacts: phoneContacts.length > 0 ? phoneContacts : undefined,
            addressContacts: addressContacts.length > 0 ? addressContacts : undefined,
            customerNumber: user.Code?.toString(),
        };
    }
};
exports.InitialImportService = InitialImportService;
exports.InitialImportService = InitialImportService = InitialImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [siagh_api_client_1.SiaghApiClient,
        crm_identity_api_client_1.CrmIdentityApiClient,
        entity_mapping_repository_1.EntityMappingRepository])
], InitialImportService);
//# sourceMappingURL=initial-import.service.js.map