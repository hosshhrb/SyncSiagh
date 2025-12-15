import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityType, SyncStatus, SystemType } from '@prisma/client';
import { CrmApiClient } from '../../crm/crm-api.client';
import { FinanceSiaghAdapter } from '../../finance/finance-siagh.adapter';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { LoopDetectorService } from '../strategy/loop-detector.service';
import { generateChecksum } from '../../common/utils/checksum.util';
import { TriggerType } from '../../common/types/sync.types';

/**
 * Simplified Customer Sync Service
 * 
 * Sync Strategy:
 * 1. Initial: Finance → CRM (one-time import)
 * 2. Ongoing: CRM → Finance (CRM is master)
 * 3. CRM always wins conflicts
 * 4. Customer number is unique key
 */
@Injectable()
export class CustomerSyncSimplifiedService {
  private readonly logger = new Logger(CustomerSyncSimplifiedService.name);

  constructor(
    private crmClient: CrmApiClient,
    private siaghAdapter: FinanceSiaghAdapter,
    private entityMappingRepo: EntityMappingRepository,
    private syncLogRepo: SyncLogRepository,
    private loopDetector: LoopDetectorService,
  ) {}

  /**
   * Sync customer from CRM to Finance (Siagh)
   * This is the main sync direction after initial import
   */
  async syncCustomerToFinance(
    crmCustomerId: string,
    triggerType: TriggerType,
    triggerPayload?: any,
  ): Promise<void> {
    const transactionId = uuidv4();

    this.logger.log(`🔄 Syncing customer from CRM to Finance: ${crmCustomerId}`);

    // Check for loop
    const isLoop = await this.loopDetector.isLoop(
      EntityType.CUSTOMER,
      crmCustomerId,
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
      crmCustomerId,
    );

    try {
      // 1. Fetch customer from CRM
      const crmCustomer = await this.crmClient.getCustomer(crmCustomerId);
      const crmChecksum = generateChecksum(crmCustomer);
      const customerNumber = crmCustomer.code;

      // Check if data actually changed
      if (
        mapping &&
        (await this.loopDetector.isDataUnchanged(EntityType.CUSTOMER, crmCustomerId, 'CRM', crmChecksum))
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
        triggerType,
        triggerPayload,
        sourceSystem: SystemType.CRM,
        targetSystem: SystemType.FINANCE,
        sourceEntityId: crmCustomerId,
        sourceData: crmCustomer,
      });

      syncLogId = syncLog.id;

      // 3. Check if customer exists in Finance
      if (mapping?.financeId) {
        // Update existing customer in Finance
        this.logger.log(`   Updating existing Finance customer: ${mapping.financeId}`);

        const financeCustomer = await this.siaghAdapter.getCustomer(mapping.financeId);
        const updateData = this.transformCrmToFinance(crmCustomer);

        const updatedCustomer = await this.siaghAdapter.updateCustomer(
          mapping.financeId,
          updateData,
          transactionId,
        );

        const financeChecksum = generateChecksum(updatedCustomer);

        // Update mapping
        await this.entityMappingRepo.update(mapping.id, {
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmChecksum,
          financeChecksum,
            crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
          financeUpdatedAt: new Date(),
        });

        // Complete sync log
        await this.syncLogRepo.complete(syncLogId, {
          status: SyncStatus.SUCCESS,
          targetEntityId: mapping.financeId,
          targetDataAfter: updatedCustomer,
        });

        this.logger.log(`✅ Updated Finance customer ${mapping.financeId}`);
      } else {
        // Check if customer exists by customer number
        if (customerNumber) {
          try {
            const existingCustomer = await this.siaghAdapter.getCustomer(customerNumber);
            
            if (existingCustomer) {
              this.logger.log(`   Found existing Finance customer by number: ${customerNumber}`);
              
              // Create mapping
              mapping = await this.entityMappingRepo.create({
                entityType: EntityType.CUSTOMER,
                crmId: crmCustomerId,
                financeId: customerNumber,
                lastSyncSource: SystemType.CRM,
                lastSyncTransactionId: transactionId,
                crmChecksum,
                financeChecksum: generateChecksum(existingCustomer),
                crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
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
            // Customer doesn't exist, will create below
          }
        }

        // Create new customer in Finance
        this.logger.log(`   Creating new Finance customer`);

        const createData = this.transformCrmToFinance(crmCustomer);
        const newCustomer = await this.siaghAdapter.createCustomer(createData, transactionId);

        const financeChecksum = generateChecksum(newCustomer);

        // Create mapping
        mapping = await this.entityMappingRepo.create({
          entityType: EntityType.CUSTOMER,
          crmId: crmCustomerId,
          financeId: newCustomer.id,
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmChecksum,
          financeChecksum,
            crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
          financeUpdatedAt: new Date(),
        });

        await this.syncLogRepo.complete(syncLogId, {
          status: SyncStatus.SUCCESS,
          targetEntityId: newCustomer.id,
          targetDataAfter: newCustomer,
        });

        this.logger.log(`✅ Created Finance customer ${newCustomer.id}`);
      }
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
   * Transform CRM customer to Finance format
   */
  private transformCrmToFinance(crmCustomer: any): any {
    return {
      name: crmCustomer.name,
      firstName: crmCustomer.firstName,
      lastName: crmCustomer.lastName,
      companyName: crmCustomer.companyName,
      phone: crmCustomer.phone,
      mobile: crmCustomer.mobile,
      email: crmCustomer.email,
      address: crmCustomer.address,
      city: crmCustomer.city,
      state: crmCustomer.state,
      country: crmCustomer.country,
      postalCode: crmCustomer.postalCode,
      nationalCode: crmCustomer.nationalCode,
      economicCode: crmCustomer.economicCode,
      registrationNumber: crmCustomer.registrationNumber,
      taxCode: crmCustomer.taxCode,
      customerType: crmCustomer.customerType,
      notes: crmCustomer.description,
      customFields: {
        ...crmCustomer.customFields,
        customerNumber: crmCustomer.code, // Store CRM customer number
      },
    };
  }
}

