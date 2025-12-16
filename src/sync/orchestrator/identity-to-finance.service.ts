import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityType, SyncStatus, SystemType } from '@prisma/client';
import { CrmIdentityApiClient } from '../../crm/crm-identity-api.client';
import { FinanceSiaghAdapter } from '../../finance/finance-siagh.adapter';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { LoopDetectorService } from '../strategy/loop-detector.service';
import { generateChecksum } from '../../common/utils/checksum.util';
import { CrmPersonDto, CrmOrganizationDto } from '../../crm/dto/crm-customer.dto';
import { CreateFinanceCustomerDto } from '../../finance/dto/finance-customer.dto';

/**
 * Identity to Finance Sync Service
 * 
 * Handles syncing CRM identities (Person/Organization) to Finance (Siagh)
 * This is the main ongoing sync after initial import
 */
@Injectable()
export class IdentityToFinanceService {
  private readonly logger = new Logger(IdentityToFinanceService.name);

  constructor(
    private crmIdentityClient: CrmIdentityApiClient,
    private siaghAdapter: FinanceSiaghAdapter,
    private entityMappingRepo: EntityMappingRepository,
    private syncLogRepo: SyncLogRepository,
    private loopDetector: LoopDetectorService,
  ) {}

  /**
   * Sync identity from CRM to Finance
   * Called when identity is created/updated in CRM
   */
  async syncIdentityToFinance(
    identityId: string,
    identityType: 'Person' | 'Organization',
    triggerPayload?: any,
  ): Promise<void> {
    const transactionId = uuidv4();

    this.logger.log('🔄 ================== SYNCING IDENTITY TO FINANCE ==================');
    this.logger.log(`   Identity ID: ${identityId}`);
    this.logger.log(`   Identity Type: ${identityType}`);
    this.logger.log(`   Transaction ID: ${transactionId}`);

    // Check for loop
    const isLoop = await this.loopDetector.isLoop(
      EntityType.CUSTOMER,
      identityId,
      'CRM',
      transactionId,
    );

    if (isLoop) {
      this.logger.warn(`⏭️  Loop detected, skipping`);
      return;
    }

    let syncLogId: string | undefined;
    let mapping = await this.entityMappingRepo.findByEntityId(
      EntityType.CUSTOMER,
      'CRM',
      identityId,
    );

    try {
      // 1. Fetch identity from CRM
      this.logger.log('📥 Fetching identity from CRM...');
      let crmIdentity: CrmPersonDto | CrmOrganizationDto;
      let customerNumber: string | undefined;

      if (identityType === 'Person') {
        crmIdentity = await this.crmIdentityClient.getPerson(identityId);
        customerNumber = (crmIdentity as CrmPersonDto).customerNumber;
        this.logger.log(`   Person: ${crmIdentity.nickName}`);
      } else {
        crmIdentity = await this.crmIdentityClient.getOrganization(identityId);
        customerNumber = (crmIdentity as CrmOrganizationDto).customerNumber;
        this.logger.log(`   Organization: ${crmIdentity.nickName}`);
      }

      // Log the CRM identity structure
      this.logger.log('📋 CRM Identity Data:');
      this.logger.log(JSON.stringify(crmIdentity, null, 2));

      const crmChecksum = generateChecksum(crmIdentity);

      // Check if data actually changed
      if (
        mapping &&
        (await this.loopDetector.isDataUnchanged(EntityType.CUSTOMER, identityId, 'CRM', crmChecksum))
      ) {
        this.logger.log(`⏭️  No changes detected, skipping`);
        return;
      }

      // 2. Create sync log
      const syncLog = await this.syncLogRepo.create({
        transactionId,
        entityMappingId: mapping?.id || 'pending',
        direction: 'CRM_TO_FINANCE',
        status: SyncStatus.IN_PROGRESS,
        triggerType: 'WEBHOOK',
        triggerPayload,
        sourceSystem: SystemType.CRM,
        targetSystem: SystemType.FINANCE,
        sourceEntityId: identityId,
        sourceData: crmIdentity,
      });

      syncLogId = syncLog.id;

      // 3. Transform to Finance format
      this.logger.log('🔄 Transforming to Finance format...');
      const financeData = this.transformCrmToFinance(crmIdentity, identityType);
      
      this.logger.log('📋 Finance Data to Send:');
      this.logger.log(JSON.stringify(financeData, null, 2));

      // 4. Check if exists in Finance
      if (mapping?.financeId) {
        // Update existing customer in Finance
        this.logger.log(`   Updating existing Finance customer: ${mapping.financeId}`);

        const updatedCustomer = await this.siaghAdapter.updateCustomer(
          mapping.financeId,
          { ...financeData, id: mapping.financeId },
          transactionId,
        );

        const financeChecksum = generateChecksum(updatedCustomer);

        // Update mapping
        await this.entityMappingRepo.update(mapping.id, {
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmChecksum,
          financeChecksum,
          crmUpdatedAt: new Date(),
          financeUpdatedAt: new Date(),
        });

        await this.syncLogRepo.complete(syncLogId, {
          status: SyncStatus.SUCCESS,
          targetEntityId: mapping.financeId,
          targetDataAfter: updatedCustomer,
        });

        this.logger.log(`✅ Updated Finance customer ${mapping.financeId}`);
      } else {
        // Check if exists by customer number
        if (customerNumber) {
          try {
            this.logger.log(`   Checking if customer exists in Finance by number: ${customerNumber}`);
            const existingCustomer = await this.siaghAdapter.getCustomer(customerNumber);
            
            if (existingCustomer) {
              this.logger.log(`   Found existing Finance customer: ${customerNumber}`);
              
              // Create mapping
              mapping = await this.entityMappingRepo.create({
                entityType: EntityType.CUSTOMER,
                crmId: identityId,
                financeId: customerNumber,
                lastSyncSource: SystemType.CRM,
                lastSyncTransactionId: transactionId,
                crmChecksum,
                financeChecksum: generateChecksum(existingCustomer),
                crmUpdatedAt: new Date(),
                financeUpdatedAt: new Date(),
              });

              await this.syncLogRepo.complete(syncLogId, {
                status: SyncStatus.SUCCESS,
                targetEntityId: customerNumber,
                targetDataAfter: existingCustomer,
              });

              this.logger.log(`✅ Linked existing Finance customer ${customerNumber}`);
              return;
            }
          } catch (error) {
            this.logger.debug(`   Customer not found in Finance, will create new`);
          }
        }

        // Create new customer in Finance
        this.logger.log(`   Creating new Finance customer`);

        const newCustomer = await this.siaghAdapter.createCustomer(financeData, transactionId);

        const financeChecksum = generateChecksum(newCustomer);

        // Create mapping
        mapping = await this.entityMappingRepo.create({
          entityType: EntityType.CUSTOMER,
          crmId: identityId,
          financeId: newCustomer.id,
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmChecksum,
          financeChecksum,
          crmUpdatedAt: new Date(),
          financeUpdatedAt: new Date(),
        });

        await this.syncLogRepo.complete(syncLogId, {
          status: SyncStatus.SUCCESS,
          targetEntityId: newCustomer.id,
          targetDataAfter: newCustomer,
        });

        this.logger.log(`✅ Created Finance customer ${newCustomer.id}`);
      }

      this.logger.log('========================================================================');
    } catch (error) {
      this.logger.error(`❌ Sync failed: ${error.message}`, error.stack);

      if (syncLogId) {
        await this.syncLogRepo.complete(syncLogId, {
          status: SyncStatus.FAILED,
          errorMessage: error.message,
          errorStack: error.stack,
        });
      }

      throw error;
    }
  }

  /**
   * Transform CRM identity to Finance format
   */
  private transformCrmToFinance(
    crmIdentity: CrmPersonDto | CrmOrganizationDto,
    identityType: 'Person' | 'Organization',
  ): CreateFinanceCustomerDto {
    // Extract first phone number
    const primaryPhone = crmIdentity.phoneContacts?.[0];
    const mobilePhone = crmIdentity.phoneContacts?.find((p) => p.phoneType?.toLowerCase().includes('mobile'));
    const officePhone = crmIdentity.phoneContacts?.find((p) => p.phoneType?.toLowerCase().includes('office'));

    // Extract first address
    const primaryAddress = crmIdentity.addressContacts?.[0];

    // Base transformation
    const financeData: CreateFinanceCustomerDto = {
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

    // Add person-specific fields
    if (identityType === 'Person') {
      const person = crmIdentity as CrmPersonDto;
      financeData.firstName = person.firstName;
      financeData.lastName = person.lastName;
    } else {
      // Organization
      const org = crmIdentity as CrmOrganizationDto;
      financeData.companyName = crmIdentity.nickName;
      financeData.registrationNumber = org.registerNumber;
    }

    return financeData;
  }
}

