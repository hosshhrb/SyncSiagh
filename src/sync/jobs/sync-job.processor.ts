import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InitialImportService } from '../orchestrator/initial-import.service';
import { CrmIdentityToSiaghService } from '../orchestrator/crm-identity-to-siagh.service';
import { CrmInvoiceToSiaghService } from '../orchestrator/crm-invoice-to-siagh.service';
import { EntityType } from '@prisma/client';

interface WebhookEventJob {
  source: 'CRM' | 'FINANCE';
  eventId: string;
  eventType?: string;
  entityType: string;
  entityId: string;
  identityType?: string;  // 'Person' | 'Organization'
  invoiceId?: string;
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

  constructor(
    private initialImportService: InitialImportService,
    private identitySyncService: CrmIdentityToSiaghService,
    private invoiceSyncService: CrmInvoiceToSiaghService,
  ) {
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
    this.logger.log(`   Identity Type: ${data.identityType || 'Unknown'}`);
    this.logger.log(`   Timestamp: ${data.timestamp}`);
    this.logger.log('');

    // Determine identity type from payload or default to Person
    const identityType = (data.identityType === 'Organization' || 
                          data.rawPayload?.identityType === 'Organization') 
                         ? 'Organization' 
                         : 'Person';

    try {
      // Sync identity to Siagh
      await this.identitySyncService.syncIdentity(
        data.entityId,
        identityType,
        data.rawPayload,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to sync identity: ${error.message}`);
      throw error; // Will trigger retry
    }
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

    // Extract invoice data from payload (optional - will fetch from CRM if not provided)
    const invoiceData = data.rawPayload?.data || data.rawPayload;

    try {
      // Sync invoice to Siagh (will fetch from CRM if invoiceData is incomplete)
      await this.invoiceSyncService.syncInvoice(
        data.entityId,
        invoiceData?.customerId ? invoiceData : undefined,
        data.rawPayload,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to sync invoice: ${error.message}`);
      throw error; // Will trigger retry
    }
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
