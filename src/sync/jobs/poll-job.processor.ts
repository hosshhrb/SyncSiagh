import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { CrmApiClient } from '../../crm/crm-api.client';
import { FinanceApiClient } from '../../finance/finance-api.client';
import { EntityType } from '@prisma/client';

@Injectable()
export class PollJobScheduler {
  private readonly logger = new Logger(PollJobScheduler.name);
  private readonly pollIntervalSeconds: number;
  private lastPollTime: Date = new Date(Date.now() - 24 * 60 * 60 * 1000); // Start with 24h ago

  constructor(
    private configService: ConfigService,
    private crmClient: CrmApiClient,
    private financeClient: FinanceApiClient,
    @InjectQueue('sync') private syncQueue: Queue,
  ) {
    this.pollIntervalSeconds = this.configService.get<number>('sync.pollIntervalSeconds', 300);
  }

  /**
   * Poll CRM for customer changes every N minutes
   * Cron: Every 5 minutes by default
   * DISABLED: Using webhooks instead of polling
   */
  // @Cron(CronExpression.EVERY_5_MINUTES)
  async pollCrmCustomers() {
    if (!this.configService.get<boolean>('sync.enableWebhooks', false)) {
      this.logger.log('🔄 Polling CRM for customer changes...');

      try {
        // Get customers updated since last poll
        const updatedCustomers = await this.crmClient.getCustomersUpdatedSince(
          this.lastPollTime,
        );

        if (updatedCustomers.length > 0) {
          this.logger.log(`Found ${updatedCustomers.length} updated customers in CRM`);

          // Queue sync jobs in batches
          const batchSize = 20;
          for (let i = 0; i < updatedCustomers.length; i += batchSize) {
            const batch = updatedCustomers.slice(i, i + batchSize);
            const entityIds = batch.map((c) => c.id);

            await this.syncQueue.add('poll-sync', {
              entityType: EntityType.CUSTOMER,
              direction: 'CRM_TO_FINANCE',
              entityIds,
            });
          }

          this.logger.log(`✅ Queued ${updatedCustomers.length} customers for sync`);
        } else {
          this.logger.log(`No updated customers found in CRM`);
        }

        this.lastPollTime = new Date();
      } catch (error) {
        this.logger.error(`❌ CRM polling failed: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Poll Finance for customer changes every N minutes
   * DISABLED: Using webhooks instead of polling
   */
  // @Cron(CronExpression.EVERY_5_MINUTES)
  async pollFinanceCustomers() {
    if (!this.configService.get<boolean>('sync.enableWebhooks', false)) {
      this.logger.log('🔄 Polling Finance for customer changes...');

      try {
        // Get customers updated since last poll
        const updatedCustomers = await this.financeClient.getCustomersUpdatedSince(
          this.lastPollTime,
        );

        if (updatedCustomers.length > 0) {
          this.logger.log(`Found ${updatedCustomers.length} updated customers in Finance`);

          // Queue sync jobs in batches
          const batchSize = 20;
          for (let i = 0; i < updatedCustomers.length; i += batchSize) {
            const batch = updatedCustomers.slice(i, i + batchSize);
            const entityIds = batch.map((c) => c.id);

            await this.syncQueue.add('poll-sync', {
              entityType: EntityType.CUSTOMER,
              direction: 'FINANCE_TO_CRM',
              entityIds,
            });
          }

          this.logger.log(`✅ Queued ${updatedCustomers.length} customers for sync`);
        } else {
          this.logger.log(`No updated customers found in Finance`);
        }
      } catch (error) {
        this.logger.error(`❌ Finance polling failed: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Health check - log sync statistics
   */
  @Cron(CronExpression.EVERY_HOUR)
  async logSyncStats() {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.syncQueue.getWaitingCount(),
        this.syncQueue.getActiveCount(),
        this.syncQueue.getCompletedCount(),
        this.syncQueue.getFailedCount(),
      ]);

      this.logger.log(
        `📊 Sync Queue Stats - Waiting: ${waiting}, Active: ${active}, Completed: ${completed}, Failed: ${failed}`,
      );
    } catch (error) {
      this.logger.error(`Failed to get queue stats: ${error.message}`);
    }
  }
}

