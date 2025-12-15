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
var InitialSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSyncService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const siagh_api_client_1 = require("../../finance/siagh-api.client");
const crm_api_client_1 = require("../../crm/crm-api.client");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
const checksum_util_1 = require("../../common/utils/checksum.util");
let InitialSyncService = InitialSyncService_1 = class InitialSyncService {
    constructor(siaghClient, crmClient, entityMappingRepo) {
        this.siaghClient = siaghClient;
        this.crmClient = crmClient;
        this.entityMappingRepo = entityMappingRepo;
        this.logger = new common_1.Logger(InitialSyncService_1.name);
    }
    async importCustomersFromFinance() {
        this.logger.log('🔄 Starting initial import: Finance → CRM');
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        try {
            this.logger.log('📥 Fetching all contacts from Siagh Finance...');
            const siaghContacts = await this.siaghClient.getAllContacts();
            this.logger.log(`   Found ${siaghContacts.length} contacts in Siagh`);
            this.logger.log('📥 Fetching existing customers from CRM...');
            const crmCustomers = await this.crmClient.getCustomers(1, 1000);
            const existingCustomerNumbers = new Set(crmCustomers.data?.map((c) => c.code).filter(Boolean) || []);
            this.logger.log(`   Found ${existingCustomerNumbers.size} existing customers in CRM`);
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
                    const crmCustomerData = {
                        name: siaghContact.FullName || '',
                        mobile: siaghContact.MobileNo,
                        phone: siaghContact.TelNo,
                        email: siaghContact.Email,
                        address: siaghContact.Address,
                        city: siaghContact.CodeShahr,
                        state: siaghContact.CodeOstan,
                        country: siaghContact.CountryCode,
                        postalCode: siaghContact.PoCode,
                        description: siaghContact.Tozihat,
                    };
                    this.logger.log(`   ➕ Creating customer in CRM: ${crmCustomerData.name} (${customerNumber})`);
                    const newCrmCustomer = await this.crmClient.createCustomer(crmCustomerData);
                    const financeChecksum = (0, checksum_util_1.generateChecksum)(siaghContact);
                    const crmChecksum = (0, checksum_util_1.generateChecksum)(newCrmCustomer);
                    await this.entityMappingRepo.create({
                        entityType: client_1.EntityType.CUSTOMER,
                        crmId: newCrmCustomer.id,
                        financeId: customerNumber,
                        lastSyncSource: client_1.SystemType.FINANCE,
                        lastSyncTransactionId: 'initial-import',
                        crmChecksum,
                        financeChecksum,
                        crmUpdatedAt: new Date(newCrmCustomer.updatedAt || newCrmCustomer.createdAt || new Date()),
                        financeUpdatedAt: new Date(),
                    });
                    this.logger.log(`   ✅ Imported: ${crmCustomerData.name} → CRM ID: ${newCrmCustomer.id}`);
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
    async hasInitialImportCompleted() {
        const mappings = await this.entityMappingRepo.findStaleForPolling(client_1.EntityType.CUSTOMER, 999999);
        const financeSourceMappings = mappings.filter((m) => m.lastSyncSource === client_1.SystemType.FINANCE && m.lastSyncTransactionId === 'initial-import');
        return financeSourceMappings.length > 0;
    }
};
exports.InitialSyncService = InitialSyncService;
exports.InitialSyncService = InitialSyncService = InitialSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [siagh_api_client_1.SiaghApiClient,
        crm_api_client_1.CrmApiClient,
        entity_mapping_repository_1.EntityMappingRepository])
], InitialSyncService);
//# sourceMappingURL=initial-sync.service.js.map