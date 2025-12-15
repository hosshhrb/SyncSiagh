import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityType, SyncStatus, SystemType } from '@prisma/client';
import { CrmApiClient } from '../../crm/crm-api.client';
import { FinanceApiClient } from '../../finance/finance-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { ConflictResolverService } from '../strategy/conflict-resolver.service';
import { LoopDetectorService } from '../strategy/loop-detector.service';
import { generateChecksum } from '../../common/utils/checksum.util';
import { SyncDirection, TriggerType } from '../../common/types/sync.types';
import { CrmCustomerDto, CreateCrmCustomerDto } from '../../crm/dto/crm-customer.dto';
import {
  FinanceCustomerDto,
  CreateFinanceCustomerDto,
} from '../../finance/dto/finance-customer.dto';

@Injectable()
export class CustomerSyncService {
  private readonly logger = new Logger(CustomerSyncService.name);

  constructor(
    private crmClient: CrmApiClient,
    private financeClient: FinanceApiClient,
    private entityMappingRepo: EntityMappingRepository,
    private syncLogRepo: SyncLogRepository,
    private conflictResolver: ConflictResolverService,
    private loopDetector: LoopDetectorService,
  ) {}

  /**
   * Sync a customer from CRM to Finance
   */
  async syncFromCrmToFinance(
    crmCustomerId: string,
    triggerType: TriggerType,
    triggerPayload?: any,
  ): Promise<void> {
    const transactionId = uuidv4();
    const direction: SyncDirection = 'CRM_TO_FINANCE';

    this.logger.log(`🔄 Starting sync: CRM -> Finance | Customer ${crmCustomerId}`);

    // Check for loop
    const isLoop = await this.loopDetector.isLoop(
      EntityType.CUSTOMER,
      crmCustomerId,
      'CRM',
      transactionId,
    );

    if (isLoop) {
      this.logger.warn(`⏭️ Skipping sync due to loop detection`);
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

      // Check if data actually changed using checksum
      if (
        mapping &&
        (await this.loopDetector.isDataUnchanged(
          EntityType.CUSTOMER,
          crmCustomerId,
          'CRM',
          crmChecksum,
        ))
      ) {
        this.logger.log(`⏭️ Skipping sync - data unchanged`);
        return;
      }

      // 2. Create initial sync log
      const syncLog = await this.syncLogRepo.create({
        transactionId,
        entityMappingId: mapping?.id || 'pending',
        direction,
        status: SyncStatus.IN_PROGRESS,
        triggerType,
        triggerPayload,
        sourceSystem: SystemType.CRM,
        targetSystem: SystemType.FINANCE,
        sourceEntityId: crmCustomerId,
        sourceData: crmCustomer,
      });

      syncLogId = syncLog.id;

      // 3. Check if mapping exists
      if (mapping?.financeId) {
        // Entity exists in Finance - check for conflicts
        const financeCustomer = await this.financeClient.getCustomer(mapping.financeId);

        const resolution = this.conflictResolver.resolve({
          sourceUpdatedAt: crmCustomer.updatedAt || crmCustomer.createdAt || new Date(),
          targetUpdatedAt:
            financeCustomer.updatedAt || financeCustomer.createdAt || new Date(),
          sourceSystem: 'CRM',
          targetSystem: 'Finance',
        });

        if (!resolution.shouldSync) {
          await this.syncLogRepo.complete(syncLogId, {
            status: SyncStatus.CONFLICT,
            errorMessage: resolution.reason,
          });
          this.logger.warn(`⚠️ Conflict: ${resolution.reason}`);
          return;
        }

        // Update Finance customer
        const updateData = this.transformCrmToFinance(crmCustomer);
        const updatedFinanceCustomer = await this.financeClient.updateCustomer(
          mapping.financeId,
          { ...updateData, id: mapping.financeId },
          transactionId,
        );

        const financeChecksum = generateChecksum(updatedFinanceCustomer);

        // Update mapping
        await this.entityMappingRepo.update(mapping.id, {
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmChecksum,
          financeChecksum,
          crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
          financeUpdatedAt: new Date(
            updatedFinanceCustomer.updatedAt || updatedFinanceCustomer.createdAt || new Date(),
          ),
        });

        // Complete sync log
        await this.syncLogRepo.complete(syncLogId, {
          status: SyncStatus.SUCCESS,
          targetEntityId: mapping.financeId,
          targetDataAfter: updatedFinanceCustomer,
        });

        this.logger.log(`✅ Successfully updated Finance customer ${mapping.financeId}`);
      } else {
        // Entity doesn't exist in Finance - create new
        const createData = this.transformCrmToFinance(crmCustomer);
        const newFinanceCustomer = await this.financeClient.createCustomer(
          createData,
          transactionId,
        );

        const financeChecksum = generateChecksum(newFinanceCustomer);

        // Create or update mapping
        if (mapping) {
          await this.entityMappingRepo.update(mapping.id, {
            financeId: newFinanceCustomer.id,
            lastSyncSource: SystemType.CRM,
            lastSyncTransactionId: transactionId,
            crmChecksum,
            financeChecksum,
            crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
            financeUpdatedAt: new Date(
              newFinanceCustomer.updatedAt || newFinanceCustomer.createdAt || new Date(),
            ),
          });
        } else {
          mapping = await this.entityMappingRepo.create({
            entityType: EntityType.CUSTOMER,
            crmId: crmCustomerId,
            financeId: newFinanceCustomer.id,
            lastSyncSource: SystemType.CRM,
            lastSyncTransactionId: transactionId,
            crmChecksum,
            financeChecksum,
            crmUpdatedAt: new Date(crmCustomer.updatedAt || crmCustomer.createdAt || new Date()),
            financeUpdatedAt: new Date(
              newFinanceCustomer.updatedAt || newFinanceCustomer.createdAt || new Date(),
            ),
          });

          // Update sync log with correct mapping ID
          await this.syncLogRepo.complete(syncLogId, {
            status: SyncStatus.IN_PROGRESS,
          });
        }

        // Complete sync log
        await this.syncLogRepo.complete(syncLogId, {
          status: SyncStatus.SUCCESS,
          targetEntityId: newFinanceCustomer.id,
          targetDataAfter: newFinanceCustomer,
        });

        this.logger.log(`✅ Successfully created Finance customer ${newFinanceCustomer.id}`);
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
   * Sync a customer from Finance to CRM
   */
  async syncFromFinanceToCrm(
    financeCustomerId: string,
    triggerType: TriggerType,
    triggerPayload?: any,
  ): Promise<void> {
    const transactionId = uuidv4();
    const direction: SyncDirection = 'FINANCE_TO_CRM';

    this.logger.log(`🔄 Starting sync: Finance -> CRM | Customer ${financeCustomerId}`);

    // Check for loop
    const isLoop = await this.loopDetector.isLoop(
      EntityType.CUSTOMER,
      financeCustomerId,
      'FINANCE',
      transactionId,
    );

    if (isLoop) {
      this.logger.warn(`⏭️ Skipping sync due to loop detection`);
      return;
    }

    let syncLogId: string | undefined;
    let mapping = await this.entityMappingRepo.findByEntityId(
      EntityType.CUSTOMER,
      'FINANCE',
      financeCustomerId,
    );

    try {
      // 1. Fetch customer from Finance
      const financeCustomer = await this.financeClient.getCustomer(financeCustomerId);
      const financeChecksum = generateChecksum(financeCustomer);

      // Check if data actually changed
      if (
        mapping &&
        (await this.loopDetector.isDataUnchanged(
          EntityType.CUSTOMER,
          financeCustomerId,
          'FINANCE',
          financeChecksum,
        ))
      ) {
        this.logger.log(`⏭️ Skipping sync - data unchanged`);
        return;
      }

      // 2. Create initial sync log
      const syncLog = await this.syncLogRepo.create({
        transactionId,
        entityMappingId: mapping?.id || 'pending',
        direction,
        status: SyncStatus.IN_PROGRESS,
        triggerType,
        triggerPayload,
        sourceSystem: SystemType.FINANCE,
        targetSystem: SystemType.CRM,
        sourceEntityId: financeCustomerId,
        sourceData: financeCustomer,
      });

      syncLogId = syncLog.id;

      // 3. Check if mapping exists
      if (mapping?.crmId) {
        // Entity exists in CRM - check for conflicts
        const crmCustomer = await this.crmClient.getCustomer(mapping.crmId);

        const resolution = this.conflictResolver.resolve({
          sourceUpdatedAt:
            financeCustomer.updatedAt || financeCustomer.createdAt || new Date(),
          targetUpdatedAt: crmCustomer.updatedAt || crmCustomer.createdAt || new Date(),
          sourceSystem: 'Finance',
          targetSystem: 'CRM',
        });

        if (!resolution.shouldSync) {
          await this.syncLogRepo.complete(syncLogId, {
            status: SyncStatus.CONFLICT,
            errorMessage: resolution.reason,
          });
          this.logger.warn(`⚠️ Conflict: ${resolution.reason}`);
          return;
        }

        // Update CRM customer
        const updateData = this.transformFinanceToCrm(financeCustomer);
        const updatedCrmCustomer = await this.crmClient.updateCustomer(mapping.crmId, {
          ...updateData,
          id: mapping.crmId,
        });

        const crmChecksum = generateChecksum(updatedCrmCustomer);

        // Update mapping
        await this.entityMappingRepo.update(mapping.id, {
          lastSyncSource: SystemType.FINANCE,
          lastSyncTransactionId: transactionId,
          crmChecksum,
          financeChecksum,
          crmUpdatedAt: new Date(updatedCrmCustomer.updatedAt || updatedCrmCustomer.createdAt || new Date()),
          financeUpdatedAt: new Date(
            financeCustomer.updatedAt || financeCustomer.createdAt || new Date(),
          ),
        });

        // Complete sync log
        await this.syncLogRepo.complete(syncLogId, {
          status: SyncStatus.SUCCESS,
          targetEntityId: mapping.crmId,
          targetDataAfter: updatedCrmCustomer,
        });

        this.logger.log(`✅ Successfully updated CRM customer ${mapping.crmId}`);
      } else {
        // Entity doesn't exist in CRM - create new
        const createData = this.transformFinanceToCrm(financeCustomer);
        const newCrmCustomer = await this.crmClient.createCustomer(createData);

        const crmChecksum = generateChecksum(newCrmCustomer);

        // Create or update mapping
        if (mapping) {
          await this.entityMappingRepo.update(mapping.id, {
            crmId: newCrmCustomer.id,
            lastSyncSource: SystemType.FINANCE,
            lastSyncTransactionId: transactionId,
            crmChecksum,
            financeChecksum,
            crmUpdatedAt: new Date(newCrmCustomer.updatedAt || newCrmCustomer.createdAt || new Date()),
            financeUpdatedAt: new Date(
              financeCustomer.updatedAt || financeCustomer.createdAt || new Date(),
            ),
          });
        } else {
          mapping = await this.entityMappingRepo.create({
            entityType: EntityType.CUSTOMER,
            crmId: newCrmCustomer.id,
            financeId: financeCustomerId,
            lastSyncSource: SystemType.FINANCE,
            lastSyncTransactionId: transactionId,
            crmChecksum,
            financeChecksum,
            crmUpdatedAt: new Date(newCrmCustomer.updatedAt || newCrmCustomer.createdAt || new Date()),
            financeUpdatedAt: new Date(
              financeCustomer.updatedAt || financeCustomer.createdAt || new Date(),
            ),
          });
        }

        // Complete sync log
        await this.syncLogRepo.complete(syncLogId, {
          status: SyncStatus.SUCCESS,
          targetEntityId: newCrmCustomer.id,
          targetDataAfter: newCrmCustomer,
        });

        this.logger.log(`✅ Successfully created CRM customer ${newCrmCustomer.id}`);
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
   * Transform CRM customer to Finance customer format
   */
  private transformCrmToFinance(crmCustomer: CrmCustomerDto): CreateFinanceCustomerDto {
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
      customFields: crmCustomer.customFields,
    };
  }

  /**
   * Transform Finance customer to CRM customer format
   */
  private transformFinanceToCrm(financeCustomer: FinanceCustomerDto): CreateCrmCustomerDto {
    return {
      name: financeCustomer.name,
      firstName: financeCustomer.firstName,
      lastName: financeCustomer.lastName,
      companyName: financeCustomer.companyName,
      phone: financeCustomer.phone,
      mobile: financeCustomer.mobile,
      email: financeCustomer.email,
      address: financeCustomer.address,
      city: financeCustomer.city,
      state: financeCustomer.state,
      country: financeCustomer.country,
      postalCode: financeCustomer.postalCode,
      nationalCode: financeCustomer.nationalCode,
      economicCode: financeCustomer.economicCode,
      registrationNumber: financeCustomer.registrationNumber,
      taxCode: financeCustomer.taxCode,
      customerType: financeCustomer.customerType,
      description: financeCustomer.notes,
      customFields: financeCustomer.customFields,
    };
  }
}

