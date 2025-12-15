import { Injectable, Logger } from '@nestjs/common';
import { EntityType, SystemType } from '@prisma/client';
import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmApiClient } from '../../crm/crm-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { generateChecksum } from '../../common/utils/checksum.util';
import { CreateCrmCustomerDto } from '../../crm/dto/crm-customer.dto';

/**
 * Initial Sync Service
 * 
 * Performs one-time initial synchronization:
 * - Imports all customers from Finance (Siagh) to CRM
 * - Uses customer number as unique key to prevent duplicates
 * - Creates entity mappings for future syncs
 */
@Injectable()
export class InitialSyncService {
  private readonly logger = new Logger(InitialSyncService.name);

  constructor(
    private siaghClient: SiaghApiClient,
    private crmClient: CrmApiClient,
    private entityMappingRepo: EntityMappingRepository,
  ) {}

  /**
   * Import all customers from Finance to CRM
   * This should be run only once during initial setup
   */
  async importCustomersFromFinance(): Promise<{
    imported: number;
    skipped: number;
    errors: number;
  }> {
    this.logger.log('🔄 Starting initial import: Finance → CRM');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Get all contacts from Siagh
      this.logger.log('📥 Fetching all contacts from Siagh Finance...');
      const siaghContacts = await this.siaghClient.getAllContacts();
      this.logger.log(`   Found ${siaghContacts.length} contacts in Siagh`);

      // Get existing customers from CRM to check for duplicates
      this.logger.log('📥 Fetching existing customers from CRM...');
      const crmCustomers = await this.crmClient.getCustomers(1, 1000);
      const existingCustomerNumbers = new Set(
        crmCustomers.data?.map((c) => c.code).filter(Boolean) || [],
      );
      this.logger.log(`   Found ${existingCustomerNumbers.size} existing customers in CRM`);

      // Process each Siagh contact
      for (const siaghContact of siaghContacts) {
        try {
          const customerNumber = siaghContact.Code?.toString();

          if (!customerNumber) {
            this.logger.warn(`   ⏭️  Skipping contact without code: ${siaghContact.FullName}`);
            skipped++;
            continue;
          }

          // Check if already exists in CRM by customer number
          if (existingCustomerNumbers.has(customerNumber)) {
            this.logger.debug(`   ⏭️  Customer ${customerNumber} already exists in CRM, skipping`);
            skipped++;
            continue;
          }

          // Check if we already have a mapping
          const existingMapping = await this.entityMappingRepo.findByEntityId(
            EntityType.CUSTOMER,
            SystemType.FINANCE,
            customerNumber,
          );

          if (existingMapping?.crmId) {
            this.logger.debug(`   ⏭️  Customer ${customerNumber} already mapped, skipping`);
            skipped++;
            continue;
          }

          // Transform Siagh contact to CRM customer format
          const crmCustomerData: CreateCrmCustomerDto = {
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

          // Create customer in CRM
          this.logger.log(`   ➕ Creating customer in CRM: ${crmCustomerData.name} (${customerNumber})`);
          const newCrmCustomer = await this.crmClient.createCustomer(crmCustomerData);

          // Generate checksums
          const financeChecksum = generateChecksum(siaghContact);
          const crmChecksum = generateChecksum(newCrmCustomer);

          // Create entity mapping
          await this.entityMappingRepo.create({
            entityType: EntityType.CUSTOMER,
            crmId: newCrmCustomer.id,
            financeId: customerNumber,
            lastSyncSource: SystemType.FINANCE,
            lastSyncTransactionId: 'initial-import',
            crmChecksum,
            financeChecksum,
            crmUpdatedAt: new Date(newCrmCustomer.updatedAt || newCrmCustomer.createdAt || new Date()),
            financeUpdatedAt: new Date(),
          });

          this.logger.log(`   ✅ Imported: ${crmCustomerData.name} → CRM ID: ${newCrmCustomer.id}`);
          imported++;
        } catch (error) {
          this.logger.error(
            `   ❌ Failed to import customer ${siaghContact.FullName}: ${error.message}`,
          );
          errors++;
        }
      }

      this.logger.log(`\n✅ Initial import completed!`);
      this.logger.log(`   Imported: ${imported}`);
      this.logger.log(`   Skipped: ${skipped}`);
      this.logger.log(`   Errors: ${errors}`);

      return { imported, skipped, errors };
    } catch (error) {
      this.logger.error(`❌ Initial import failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if initial import has been completed
   */
  async hasInitialImportCompleted(): Promise<boolean> {
    // Check if we have any entity mappings from Finance as source
    const mappings = await this.entityMappingRepo.findStaleForPolling(EntityType.CUSTOMER, 999999);
    const financeSourceMappings = mappings.filter(
      (m) => m.lastSyncSource === SystemType.FINANCE && m.lastSyncTransactionId === 'initial-import',
    );

    return financeSourceMappings.length > 0;
  }
}

