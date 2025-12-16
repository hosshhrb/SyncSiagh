import { Injectable, Logger } from '@nestjs/common';
import { EntityType, SystemType } from '@prisma/client';
import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmIdentityApiClient } from '../../crm/crm-identity-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { generateChecksum } from '../../common/utils/checksum.util';

/**
 * Updated Initial Import Service
 * Uses actual CRM Identity APIs
 * 
 * Import flow: Finance (Siagh) → CRM (Payamgostar)
 * Uses customer number as unique key
 */
@Injectable()
export class InitialImportUpdatedService {
  private readonly logger = new Logger(InitialImportUpdatedService.name);

  constructor(
    private siaghClient: SiaghApiClient,
    private crmIdentityClient: CrmIdentityApiClient,
    private entityMappingRepo: EntityMappingRepository,
  ) {}

  /**
   * Import all customers from Finance (Siagh) to CRM
   */
  async importCustomersFromFinance(): Promise<{
    imported: number;
    skipped: number;
    errors: number;
  }> {
    this.logger.log('🔄 Starting initial import: Finance (Siagh) → CRM (Payamgostar)');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Step 1: Get all contacts from Siagh
      this.logger.log('📥 Fetching all contacts from Siagh Finance...');
      const siaghContacts = await this.siaghClient.getAllContacts();
      this.logger.log(`   Found ${siaghContacts.length} contacts in Siagh`);

      // Step 2: Get existing identities from CRM to check for duplicates
      this.logger.log('📥 Fetching existing identities from CRM...');
      const crmIdentities = await this.crmIdentityClient.getIdentitiesSimple(0, 1000);
      
      // Create map of existing customer numbers
      const existingCustomerNumbers = new Set(
        crmIdentities
          .map((i) => i.customerNo)
          .filter(Boolean)
      );
      
      this.logger.log(`   Found ${crmIdentities.length} identities in CRM`);
      this.logger.log(`   ${existingCustomerNumbers.size} have customer numbers`);

      // Step 3: Process each Siagh contact
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

          // Transform Siagh contact to CRM Person format
          const crmPersonData = this.transformSiaghToCrmPerson(siaghContact, customerNumber);

          // Create person in CRM
          this.logger.log(`   ➕ Creating person in CRM: ${crmPersonData.nickName} (${customerNumber})`);
          const response = await this.crmIdentityClient.createPerson(crmPersonData);

          // Generate checksums
          const financeChecksum = generateChecksum(siaghContact);
          const crmChecksum = generateChecksum(crmPersonData);

          // Create entity mapping
          await this.entityMappingRepo.create({
            entityType: EntityType.CUSTOMER,
            crmId: response.id,
            financeId: customerNumber,
            lastSyncSource: SystemType.FINANCE,
            lastSyncTransactionId: 'initial-import',
            crmChecksum,
            financeChecksum,
            crmUpdatedAt: new Date(),
            financeUpdatedAt: new Date(),
          });

          this.logger.log(`   ✅ Imported: ${crmPersonData.nickName} → CRM ID: ${response.id}`);
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
   * Transform Siagh contact to CRM Person format
   */
  private transformSiaghToCrmPerson(siaghContact: any, customerNumber: string): any {
    // Extract phone numbers
    const phones: any[] = [];
    if (siaghContact.MobileNo) {
      phones.push({
        default: true,
        phoneType: 'Mobile',
        phoneNumber: siaghContact.MobileNo,
      });
    }
    if (siaghContact.TelNo) {
      phones.push({
        default: !siaghContact.MobileNo, // Default if no mobile
        phoneType: 'Office',
        phoneNumber: siaghContact.TelNo,
      });
    }

    // Extract address
    const addresses: any[] = [];
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

    // Split full name into first/last name (simple approach)
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

  /**
   * Check if initial import has been completed
   */
  async hasInitialImportCompleted(): Promise<boolean> {
    const mappings = await this.entityMappingRepo.findStaleForPolling(EntityType.CUSTOMER, 999999);
    const financeSourceMappings = mappings.filter(
      (m) => m.lastSyncSource === SystemType.FINANCE && m.lastSyncTransactionId === 'initial-import',
    );

    return financeSourceMappings.length > 0;
  }
}

