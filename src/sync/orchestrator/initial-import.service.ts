import { Injectable, Logger } from '@nestjs/common';
import { EntityType, SystemType } from '@prisma/client';
import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmIdentityApiClient } from '../../crm/crm-identity-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SiaghUserDto } from '../../finance/dto/siagh-user.dto';
import {
  CrmIdentitySearchResult,
  CrmCreatePersonRequest,
  CrmCreateOrganizationRequest,
} from '../../crm/dto/crm-identity.dto';

/**
 * Import Result for logging
 */
interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  details: ImportDetail[];
}

interface ImportDetail {
  recordId: string;
  name: string;
  type: 'Person' | 'Organization';
  status: 'imported' | 'skipped' | 'error';
  crmId?: string;
  reason?: string;
}

/**
 * Initial Import Service
 * 
 * Efficiently imports identities from Siagh Finance to CRM (Payamgostar)
 * 
 * Algorithm:
 * 1. Parallel fetch: Get all users from Siagh AND all identities from CRM simultaneously
 * 2. Build lookup Set for O(1) duplicate detection
 * 3. Filter new records in single pass
 * 4. Batch create in CRM with parallel execution (configurable concurrency)
 * 5. Store mappings for future sync
 */
@Injectable()
export class InitialImportService {
  private readonly logger = new Logger(InitialImportService.name);
  private readonly BATCH_SIZE = 10; // Concurrent API calls

  constructor(
    private siaghClient: SiaghApiClient,
    private crmIdentityClient: CrmIdentityApiClient,
    private entityMappingRepo: EntityMappingRepository,
  ) {}

  /**
   * Run the initial import from Siagh to CRM
   */
  async runInitialImport(): Promise<ImportResult> {
    const startTime = Date.now();
    
    this.logger.log('');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('   INITIAL IMPORT: Siagh Finance → CRM (Payamgostar)');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('');

    const result: ImportResult = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      details: [],
    };

    try {
      // ═══════════════════════════════════════════════════════════════
      // STEP 1: Parallel fetch from both systems
      // ═══════════════════════════════════════════════════════════════
      this.logger.log('📥 STEP 1: Fetching data from both systems (parallel)...');
      
      const [siaghUsers, crmIdentities, existingMappings] = await Promise.all([
        this.siaghClient.getAllUsers(),
        this.crmIdentityClient.searchAllIdentities(),
        this.entityMappingRepo.findAll(EntityType.CUSTOMER),
      ]);

      this.logger.log(`   ✅ Siagh users: ${siaghUsers.length}`);
      this.logger.log(`   ✅ CRM identities: ${crmIdentities.length}`);
      this.logger.log(`   ✅ Existing mappings: ${existingMappings.length}`);
      this.logger.log('');

      result.total = siaghUsers.length;

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: Build lookup sets for O(1) duplicate detection
      // ═══════════════════════════════════════════════════════════════
      this.logger.log('🔍 STEP 2: Building lookup indexes...');
      
      // Set of CRM identity IDs (for checking if already imported via refId)
      const crmIdentityIds = new Set(crmIdentities.map(i => i.identityId));

      // Set of already mapped Siagh TpmIds
      const mappedTpmIds = new Set(existingMappings.map(m => m.financeId));
      
      // Map CRM identities by nickName for additional duplicate check
      const crmByNickName = new Map<string, CrmIdentitySearchResult>();
      for (const identity of crmIdentities) {
        if (identity.nickName) {
          crmByNickName.set(identity.nickName.toLowerCase().trim(), identity);
        }
      }

      this.logger.log(`   ✅ CRM identity lookup: ${crmIdentityIds.size} entries`);
      this.logger.log(`   ✅ Mapped TpmIds lookup: ${mappedTpmIds.size} entries`);
      this.logger.log(`   ✅ CRM nickName lookup: ${crmByNickName.size} entries`);
      this.logger.log('');

      // ═══════════════════════════════════════════════════════════════
      // STEP 3: Filter new records (not duplicates)
      // ═══════════════════════════════════════════════════════════════
      this.logger.log('🔄 STEP 3: Identifying new records to import...');
      
      const toImport: SiaghUserDto[] = [];
      const skipped: { user: SiaghUserDto; reason: string }[] = [];

      for (const user of siaghUsers) {
        // Check 1: Already mapped?
        if (mappedTpmIds.has(user.TpmId)) {
          skipped.push({ user, reason: 'Already mapped (TpmId exists in mappings)' });
          continue;
        }

        // Check 2: Same name exists in CRM?
        const existingByName = crmByNickName.get(user.Name?.toLowerCase().trim() || '');
        if (existingByName) {
          skipped.push({ user, reason: `Duplicate name in CRM (${existingByName.identityId})` });
          continue;
        }

        // Check 3: Skip inactive users?
        if (!user.IsActive) {
          skipped.push({ user, reason: 'Inactive user' });
          continue;
        }

        // Check 4: Skip admin users?
        if (user.IsAdminUser) {
          skipped.push({ user, reason: 'Admin user' });
          continue;
        }

        // This user needs to be imported
        toImport.push(user);
      }

      this.logger.log(`   ✅ To import: ${toImport.length}`);
      this.logger.log(`   ⏭️  Skipped: ${skipped.length}`);
      
      // Log skipped details
      if (skipped.length > 0) {
        this.logger.log('');
        this.logger.log('   Skipped records:');
        for (const { user, reason } of skipped.slice(0, 10)) {
          this.logger.log(`      - ${user.Name || user.TpmId}: ${reason}`);
          result.details.push({
            recordId: user.TpmId,
            name: user.Name || 'Unknown',
            type: user.TowardType ? 'Person' : 'Organization',
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

      // ═══════════════════════════════════════════════════════════════
      // STEP 4: Import new records to CRM (batched for efficiency)
      // ═══════════════════════════════════════════════════════════════
      if (toImport.length === 0) {
        this.logger.log('✅ No new records to import. All users are already synced!');
        return result;
      }

      this.logger.log(`🚀 STEP 4: Importing ${toImport.length} records to CRM (batch size: ${this.BATCH_SIZE})...`);
      this.logger.log('');

      // Process in batches
      for (let i = 0; i < toImport.length; i += this.BATCH_SIZE) {
        const batch = toImport.slice(i, i + this.BATCH_SIZE);
        const batchNum = Math.floor(i / this.BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(toImport.length / this.BATCH_SIZE);
        
        this.logger.log(`   📦 Batch ${batchNum}/${totalBatches} (${batch.length} records)...`);

        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(user => this.importSingleUser(user))
        );

        // Process results
        for (let j = 0; j < batchResults.length; j++) {
          const batchResult = batchResults[j];
          const user = batch[j];

          if (batchResult.status === 'fulfilled') {
            result.imported++;
            result.details.push(batchResult.value);
            this.logger.log(`      ✅ ${user.Name} → ${batchResult.value.crmId}`);
          } else {
            result.errors++;
            result.details.push({
              recordId: user.TpmId,
              name: user.Name || 'Unknown',
              type: user.TowardType ? 'Person' : 'Organization',
              status: 'error',
              reason: batchResult.reason?.message || 'Unknown error',
            });
            this.logger.error(`      ❌ ${user.Name}: ${batchResult.reason?.message}`);
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 5: Summary
      // ═══════════════════════════════════════════════════════════════
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
    } catch (error) {
      this.logger.error('❌ Import failed!', error.stack);
      throw error;
    }
  }

  /**
   * Import a single user from Siagh to CRM
   */
  private async importSingleUser(user: SiaghUserDto): Promise<ImportDetail> {
    // TowardType: true = Person, false = Organization
    const isOrganization = user.TowardType === false;
    const type = isOrganization ? 'Organization' : 'Person';

    try {
      let crmId: string;

      if (isOrganization) {
        // Create Organization
        const orgData = this.transformToOrganization(user);
        const response = await this.crmIdentityClient.createOrganization(orgData);
        crmId = response.id;
      } else {
        // Create Person
        const personData = this.transformToPerson(user);
        const response = await this.crmIdentityClient.createPerson(personData);
        crmId = response.id;
      }

      // Store mapping for future sync
      await this.entityMappingRepo.create({
        entityType: EntityType.CUSTOMER,
        crmId: crmId,
        financeId: user.TpmId,
        lastSyncSource: SystemType.FINANCE,
        lastSyncTransactionId: `initial-import-${Date.now()}`,
        crmChecksum: '',
        financeChecksum: '',
        crmUpdatedAt: new Date(),
        financeUpdatedAt: new Date(),
      });

      return {
        recordId: user.TpmId,
        name: user.Name || 'Unknown',
        type,
        status: 'imported',
        crmId,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transform Siagh user to CRM Person request
   */
  private transformToPerson(user: SiaghUserDto): CrmCreatePersonRequest {
    // Split name into first/last
    const nameParts = (user.Name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const phoneContacts: any[] = [];
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

    const addressContacts: any[] = [];
    if (user.Address || user.PostalCode) {
      addressContacts.push({
        default: true,
        address: user.Address || '',
        zipCode: user.PostalCode || '',
      });
    }

    return {
      refId: user.TpmId,  // Store Siagh TpmId for future reference
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

  /**
   * Transform Siagh user to CRM Organization request
   */
  private transformToOrganization(user: SiaghUserDto): CrmCreateOrganizationRequest {
    const phoneContacts: any[] = [];
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

    const addressContacts: any[] = [];
    if (user.Address || user.PostalCode) {
      addressContacts.push({
        default: true,
        address: user.Address || '',
        zipCode: user.PostalCode || '',
      });
    }

    return {
      refId: user.TpmId,  // Store Siagh TpmId for future reference
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
}

