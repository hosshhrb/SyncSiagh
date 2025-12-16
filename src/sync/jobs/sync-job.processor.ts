import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InitialImportService } from '../orchestrator/initial-import.service';
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
  rawPayload?: any;
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

  constructor(private initialImportService: InitialImportService) {
    super();
  }

  async process(job: Job<WebhookEventJob | PollSyncJob>): Promise<any> {
    this.logger.log(`Processing job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'webhook-event':
          return await this.processWebhookEvent(job.data as WebhookEventJob);

        case 'crm-identity-webhook':
          return await this.processCrmIdentityWebhook(job.data as WebhookEventJob);

        case 'crm-invoice-webhook':
          return await this.processCrmInvoiceWebhook(job.data as WebhookEventJob);

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
   * Process webhook event (generic)
   */
  private async processWebhookEvent(data: WebhookEventJob): Promise<void> {
    this.logger.log(
      `Processing webhook: ${data.source} - ${data.entityType} - ${data.entityId}`,
    );

    const entityType = data.entityType.toUpperCase();

    // Log the raw data for debugging
    this.logger.log('📦 Webhook Data:');
    this.logger.log(JSON.stringify(data, null, 2));

    if (entityType === 'CUSTOMER' || entityType === 'IDENTITY') {
      // TODO: Implement customer/identity sync from webhook
      this.logger.log(`Identity webhook received for ${data.entityId}`);
    } else if (entityType === 'INVOICE' || entityType === 'PREINVOICE') {
      // TODO: Implement PreInvoice sync
      this.logger.warn(`PreInvoice sync not yet fully implemented`);
    } else {
      this.logger.warn(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Process CRM identity webhook
   */
  private async processCrmIdentityWebhook(data: WebhookEventJob): Promise<void> {
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('📥 Processing CRM Identity Webhook');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log(`   Event ID: ${data.eventId}`);
    this.logger.log(`   Action: ${data.action}`);
    this.logger.log(`   Identity ID: ${data.entityId}`);
    this.logger.log(`   Timestamp: ${data.timestamp}`);
    this.logger.log('');
    this.logger.log('📦 Raw Payload:');
    this.logger.log(JSON.stringify(data.rawPayload, null, 2));
    this.logger.log('');

    // TODO: Implement CRM → Finance sync for identities
    // This would:
    // 1. Fetch the full identity from CRM
    // 2. Transform to Siagh format
    // 3. Create/update in Siagh

    this.logger.log('⚠️  CRM → Finance sync not yet implemented');
    this.logger.log('   Identity logged for inspection');
    this.logger.log('═══════════════════════════════════════════════════════════════');
  }

  /**
   * Process CRM invoice webhook
   */
  private async processCrmInvoiceWebhook(data: WebhookEventJob): Promise<void> {
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('📥 Processing CRM Invoice Webhook');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log(`   Event ID: ${data.eventId}`);
    this.logger.log(`   Action: ${data.action}`);
    this.logger.log(`   Invoice ID: ${data.entityId}`);
    this.logger.log(`   Timestamp: ${data.timestamp}`);
    this.logger.log('');
    this.logger.log('📦 Raw Payload:');
    this.logger.log(JSON.stringify(data.rawPayload, null, 2));
    this.logger.log('');

    // TODO: Implement CRM → Finance sync for invoices
    this.logger.log('⚠️  Invoice sync not yet implemented');
    this.logger.log('   Invoice logged for inspection');
    this.logger.log('═══════════════════════════════════════════════════════════════');
  }

  /**
   * Process poll sync job
   */
  private async processPollSync(data: PollSyncJob): Promise<void> {
    this.logger.log(
      `Processing poll sync: ${data.entityType} - ${data.direction} - ${data.entityIds.length} entities`,
    );

    // TODO: Implement polling sync
    this.logger.log('⚠️  Poll sync not yet implemented');
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
