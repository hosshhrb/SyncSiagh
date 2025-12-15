import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CustomerSyncService } from '../orchestrator/customer-sync.service';
import { EntityType } from '@prisma/client';

interface WebhookEventJob {
  source: 'CRM' | 'FINANCE';
  eventId: string;
  eventType?: string;
  entityType: string;
  entityId: string;
  action?: string;
  timestamp: string;
  data?: any;
}

interface PollSyncJob {
  entityType: EntityType;
  direction: 'CRM_TO_FINANCE' | 'FINANCE_TO_CRM';
  entityIds: string[];
}

@Processor('sync', {
  concurrency: 5, // Process 5 jobs concurrently
})
export class SyncJobProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncJobProcessor.name);

  constructor(private customerSyncService: CustomerSyncService) {
    super();
  }

  async process(job: Job<WebhookEventJob | PollSyncJob>): Promise<any> {
    this.logger.log(`Processing job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'webhook-event':
          return await this.processWebhookEvent(job.data as WebhookEventJob);

        case 'poll-sync':
          return await this.processPollSync(job.data as PollSyncJob);

        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      throw error; // Will trigger retry
    }
  }

  /**
   * Process webhook event
   */
  private async processWebhookEvent(data: WebhookEventJob): Promise<void> {
    this.logger.log(
      `Processing webhook: ${data.source} - ${data.entityType} - ${data.entityId}`,
    );

    const entityType = data.entityType.toUpperCase();

    // Route to appropriate sync service based on entity type
    if (entityType === 'CUSTOMER') {
      if (data.source === 'CRM') {
        await this.customerSyncService.syncFromCrmToFinance(
          data.entityId,
          'WEBHOOK',
          data,
        );
      } else {
        await this.customerSyncService.syncFromFinanceToCrm(
          data.entityId,
          'WEBHOOK',
          data,
        );
      }
    } else if (entityType === 'INVOICE' || entityType === 'PREINVOICE') {
      // TODO: Implement PreInvoice sync
      this.logger.warn(`PreInvoice sync not yet implemented`);
    } else {
      this.logger.warn(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Process poll sync job
   */
  private async processPollSync(data: PollSyncJob): Promise<void> {
    this.logger.log(
      `Processing poll sync: ${data.entityType} - ${data.direction} - ${data.entityIds.length} entities`,
    );

    const promises = data.entityIds.map(async (entityId) => {
      try {
        if (data.entityType === EntityType.CUSTOMER) {
          if (data.direction === 'CRM_TO_FINANCE') {
            await this.customerSyncService.syncFromCrmToFinance(entityId, 'POLL');
          } else {
            await this.customerSyncService.syncFromFinanceToCrm(entityId, 'POLL');
          }
        }
      } catch (error) {
        this.logger.error(`Failed to sync entity ${entityId}: ${error.message}`);
        // Don't throw - continue with other entities
      }
    });

    await Promise.all(promises);
    this.logger.log(`Completed poll sync for ${data.entityIds.length} entities`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`⚙️ Job ${job.id} started processing`);
  }
}

