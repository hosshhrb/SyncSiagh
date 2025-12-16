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
var InitialImportUpdatedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialImportUpdatedService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const siagh_api_client_1 = require("../../finance/siagh-api.client");
const crm_identity_api_client_1 = require("../../crm/crm-identity-api.client");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
const checksum_util_1 = require("../../common/utils/checksum.util");
let InitialImportUpdatedService = InitialImportUpdatedService_1 = class InitialImportUpdatedService {
    constructor(siaghClient, crmIdentityClient, entityMappingRepo) {
        this.siaghClient = siaghClient;
        this.crmIdentityClient = crmIdentityClient;
        this.entityMappingRepo = entityMappingRepo;
        this.logger = new common_1.Logger(InitialImportUpdatedService_1.name);
    }
    async importCustomersFromFinance() {
        this.logger.log('🔄 Starting initial import: Finance (Siagh) → CRM (Payamgostar)');
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        try {
            this.logger.log('📥 Fetching all contacts from Siagh Finance...');
            const siaghContacts = await this.siaghClient.getAllContacts();
            this.logger.log(`   Found ${siaghContacts.length} contacts in Siagh`);
            this.logger.log('📥 Fetching existing identities from CRM...');
            const crmIdentities = await this.crmIdentityClient.getIdentitiesSimple(0, 1000);
            const existingCustomerNumbers = new Set(crmIdentities
                .map((i) => i.customerNo)
                .filter(Boolean));
            this.logger.log(`   Found ${crmIdentities.length} identities in CRM`);
            this.logger.log(`   ${existingCustomerNumbers.size} have customer numbers`);
            for (const siaghContact of siaghContacts) {
                try {
                    const customerNumber = siaghContact.Code?.toString();
                    if (!customerNumber) {
                        this.logger.warn(`   ⏭️  Skipping contact without code: ${siaghContact.FullName}`);
                        skipped++;
                        continue;
                    }
                    if (existingCustomerNumbers.has(customerNumber)) {
                        this.logger.debug(`   ⏭️  Customer ${customerNumber} already exists in CRM, skipping`);
                        skipped++;
                        continue;
                    }
                    const existingMapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.CUSTOMER, client_1.SystemType.FINANCE, customerNumber);
                    if (existingMapping?.crmId) {
                        this.logger.debug(`   ⏭️  Customer ${customerNumber} already mapped, skipping`);
                        skipped++;
                        continue;
                    }
                    const crmPersonData = this.transformSiaghToCrmPerson(siaghContact, customerNumber);
                    this.logger.log(`   ➕ Creating person in CRM: ${crmPersonData.nickName} (${customerNumber})`);
                    const response = await this.crmIdentityClient.createPerson(crmPersonData);
                    const financeChecksum = (0, checksum_util_1.generateChecksum)(siaghContact);
                    const crmChecksum = (0, checksum_util_1.generateChecksum)(crmPersonData);
                    await this.entityMappingRepo.create({
                        entityType: client_1.EntityType.CUSTOMER,
                        crmId: response.id,
                        financeId: customerNumber,
                        lastSyncSource: client_1.SystemType.FINANCE,
                        lastSyncTransactionId: 'initial-import',
                        crmChecksum,
                        financeChecksum,
                        crmUpdatedAt: new Date(),
                        financeUpdatedAt: new Date(),
                    });
                    this.logger.log(`   ✅ Imported: ${crmPersonData.nickName} → CRM ID: ${response.id}`);
                    imported++;
                }
                catch (error) {
                    this.logger.error(`   ❌ Failed to import customer ${siaghContact.FullName}: ${error.message}`);
                    errors++;
                }
            }
            this.logger.log(`\n✅ Initial import completed!`);
            this.logger.log(`   Imported: ${imported}`);
            this.logger.log(`   Skipped: ${skipped}`);
            this.logger.log(`   Errors: ${errors}`);
            return { imported, skipped, errors };
        }
        catch (error) {
            this.logger.error(`❌ Initial import failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    transformSiaghToCrmPerson(siaghContact, customerNumber) {
        const phones = [];
        if (siaghContact.MobileNo) {
            phones.push({
                default: true,
                phoneType: 'Mobile',
                phoneNumber: siaghContact.MobileNo,
            });
        }
        if (siaghContact.TelNo) {
            phones.push({
                default: !siaghContact.MobileNo,
                phoneType: 'Office',
                phoneNumber: siaghContact.TelNo,
            });
        }
        const addresses = [];
        if (siaghContact.Address || siaghContact.CodeShahr) {
            addresses.push({
                default: true,
                country: siaghContact.CountryCode || 'Iran',
                state: siaghContact.CodeOstan || '',
                city: siaghContact.CodeShahr || '',
                address: siaghContact.Address || '',
                zipCode: siaghContact.PoCode || '',
            });
        }
        const fullName = siaghContact.FullName || '';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || fullName;
        const lastName = nameParts.slice(1).join(' ') || '';
        return {
            nickName: fullName,
            firstName,
            lastName,
            email: siaghContact.Email || '',
            website: siaghContact.WebsiteAddress || '',
            phoneContacts: phones.length > 0 ? phones : undefined,
            addressContacts: addresses.length > 0 ? addresses : undefined,
            customerNumber,
            description: siaghContact.Tozihat || `Imported from Finance (Siagh) - Code: ${customerNumber}`,
            nationalCode: '',
            economicCode: '',
        };
    }
    async hasInitialImportCompleted() {
        const mappings = await this.entityMappingRepo.findStaleForPolling(client_1.EntityType.CUSTOMER, 999999);
        const financeSourceMappings = mappings.filter((m) => m.lastSyncSource === client_1.SystemType.FINANCE && m.lastSyncTransactionId === 'initial-import');
        return financeSourceMappings.length > 0;
    }
};
exports.InitialImportUpdatedService = InitialImportUpdatedService;
exports.InitialImportUpdatedService = InitialImportUpdatedService = InitialImportUpdatedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [siagh_api_client_1.SiaghApiClient,
        crm_identity_api_client_1.CrmIdentityApiClient,
        entity_mapping_repository_1.EntityMappingRepository])
], InitialImportUpdatedService);
//# sourceMappingURL=initial-import-updated.service.js.map