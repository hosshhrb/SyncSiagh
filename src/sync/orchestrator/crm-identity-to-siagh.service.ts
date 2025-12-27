import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityType, SystemType } from '@prisma/client';
import { CrmIdentityApiClient } from '../../crm/crm-identity-api.client';
import { SiaghApiClient } from '../../finance/siagh-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { CreateSiaghContactRequest } from '../../finance/dto/siagh-contact.dto';
import { CrmPersonDto, CrmOrganizationDto } from '../../crm/dto/crm-customer.dto';
import { extractSiaghTmpId } from '../../common/utils/customer-number.util';

/**
 * CRM Identity to Siagh Sync Service
 * 
 * Syncs identities (Person/Organization) from CRM to Siagh Finance
 * Called when webhook receives identity change from CRM
 */
@Injectable()
export class CrmIdentityToSiaghService {
  private readonly logger = new Logger(CrmIdentityToSiaghService.name);

  constructor(
    private crmIdentityClient: CrmIdentityApiClient,
    private siaghClient: SiaghApiClient,
    private entityMappingRepo: EntityMappingRepository,
    private syncLogRepo: SyncLogRepository,
  ) {}

  /**
   * Sync identity from CRM to Siagh
   * 
   * Flow:
   * 1. Fetch full identity from CRM
   * 2. Check if exists in Siagh (by RecordId in refId or customerNumber)
   * 3. If NOT exists → Create in Siagh
   * 4. If exists → Update in Siagh
   * 5. Store/update entity mapping
   */
  async syncIdentity(
    identityId: string,
    identityType: 'Person' | 'Organization',
    triggerPayload?: any,
  ): Promise<void> {
    const transactionId = uuidv4();

    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('🔄 SYNCING IDENTITY: CRM → Siagh');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log(`   Identity ID: ${identityId}`);
    this.logger.log(`   Type: ${identityType}`);
    this.logger.log(`   Transaction ID: ${transactionId}`);
    this.logger.log('');

    let syncLogId: string | undefined;
    let mapping = await this.entityMappingRepo.findByEntityId(
      EntityType.CUSTOMER,
      SystemType.CRM,
      identityId,
    );

    try {
      // Step 1: Fetch identity from CRM
      this.logger.log('📥 Step 1: Fetching identity from CRM...');
      let crmIdentity: CrmPersonDto | CrmOrganizationDto;

      if (identityType === 'Person') {
        crmIdentity = await this.crmIdentityClient.getPerson(identityId);
      } else {
        crmIdentity = await this.crmIdentityClient.getOrganization(identityId);
      }

      this.logger.log(`   ✅ Retrieved: ${crmIdentity.nickName}`);
      this.logger.log(`   Customer Number (CRM): ${crmIdentity.customerNumber || 'N/A'}`);
      this.logger.log(`   Siagh tmpid: ${extractSiaghTmpId(crmIdentity.customerNumber) || 'N/A'}`);
      this.logger.log('');

      // Step 2: Check if exists in Siagh (using mapping table)
      this.logger.log('🔍 Step 2: Checking if exists in Siagh...');

      let siaghCode: string | null = null;
      const siaghTmpId = extractSiaghTmpId(crmIdentity.customerNumber);

      // Note: tmpid is NOT returned by Siagh's GetAll endpoint, so we can't search by it
      // Instead, we rely on our mapping table to track CRM ID → Siagh Code
      if (mapping?.financeId) {
        siaghCode = mapping.financeId;
        this.logger.log(`   ✅ Found in mapping: CRM ID ${identityId} → Siagh Code ${siaghCode}`);
        this.logger.log(`   Siagh tmpid (will be sent): ${siaghTmpId || 'N/A'}`);
      } else {
        this.logger.log('   ℹ️  Not found in mapping - will create new');
        this.logger.log(`   Siagh tmpid (will be sent): ${siaghTmpId || 'N/A'}`);
      }
      this.logger.log('');

      // Step 3: Transform to Siagh format
      this.logger.log('🔄 Step 3: Transforming to Siagh format...');
      const siaghData = this.transformCrmToSiagh(crmIdentity, identityType);
      this.logger.log(`   Name: ${siaghData.fullname}`);
      this.logger.log(`   Type: ${identityType} (tarafType: ${siaghData.taraftype})`);
      this.logger.log(`   Mobile: ${siaghData.mobileno || 'N/A'}`);
      this.logger.log(`   Email: ${siaghData.email || 'N/A'}`);
      this.logger.log('');

      // Step 4: Create sync log
      const syncLog = await this.syncLogRepo.create({
        transactionId,
        entityMappingId: mapping?.id,  // Optional - will be updated after mapping is created
        direction: 'CRM_TO_FINANCE',
        status: 'IN_PROGRESS',
        triggerType: 'WEBHOOK',
        triggerPayload,
        sourceSystem: SystemType.CRM,
        targetSystem: SystemType.FINANCE,
        sourceEntityId: identityId,
        sourceData: crmIdentity,
      });
      syncLogId = syncLog.id;

      // Step 5: Create or Update in Siagh
      if (siaghCode) {
        // Update existing
        this.logger.log(`📝 Step 4: Updating existing contact in Siagh (Code: ${siaghCode})...`);
        const updatedCode = await this.siaghClient.updateContact(siaghCode, siaghData);

        // Check if Siagh returned a different code (which means it created a new record)
        if (updatedCode !== siaghCode) {
          this.logger.warn(`⚠️  WARNING: Siagh returned different code! Expected: ${siaghCode}, Got: ${updatedCode}`);
          this.logger.warn(`   This indicates Siagh created a new record instead of updating.`);
          this.logger.warn(`   Updating mapping to use new code: ${updatedCode}`);
        }

        // Update mapping (always use the returned code)
        if (mapping) {
          await this.entityMappingRepo.update(mapping.id, {
            financeId: updatedCode,
            lastSyncSource: SystemType.CRM,
            lastSyncTransactionId: transactionId,
            crmUpdatedAt: new Date(),
            financeUpdatedAt: new Date(),
          });
        } else {
          mapping = await this.entityMappingRepo.create({
            entityType: EntityType.CUSTOMER,
            crmId: identityId,
            financeId: updatedCode,
            lastSyncSource: SystemType.CRM,
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
      } else {
        // Create new
        this.logger.log('📝 Step 4: Creating new contact in Siagh...');
        const newCode = await this.siaghClient.createContact(siaghData);
        
        // Create mapping
        mapping = await this.entityMappingRepo.create({
          entityType: EntityType.CUSTOMER,
          crmId: identityId,
          financeId: newCode,
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmUpdatedAt: new Date(),
          financeUpdatedAt: new Date(),
        });

        // Update sync log with the new mapping ID and mark as complete
        await this.syncLogRepo.complete(syncLogId, {
          status: 'SUCCESS',
          targetEntityId: newCode,
        });

        // Link the sync log to the newly created mapping
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

    } catch (error) {
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

  /**
   * Transform CRM identity to Siagh contact format
   */
  private transformCrmToSiagh(
    crmIdentity: CrmPersonDto | CrmOrganizationDto,
    identityType: 'Person' | 'Organization',
  ): CreateSiaghContactRequest {
    // Extract primary phone
    const mobilePhone = crmIdentity.phoneContacts?.find(
      p => p.phoneType?.toLowerCase().includes('mobile'),
    );
    const officePhone = crmIdentity.phoneContacts?.find(
      p => p.phoneType?.toLowerCase().includes('office'),
    );
    const primaryPhone = crmIdentity.phoneContacts?.[0];

    // Extract primary address
    const primaryAddress = crmIdentity.addressContacts?.[0];

    // Determine tarafType: 0 = Person, 1 = Organization
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
      tmpid: extractSiaghTmpId(crmIdentity.customerNumber) || undefined, // Extract value after dash for Siagh
      taraftype: tarafType, // 0 = Person, 1 = Organization
    };
  }
}

