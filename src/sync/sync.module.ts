import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrmModule } from '../crm/crm.module';
import { FinanceModule } from '../finance/finance.module';
import { DatabaseModule } from '../database/database.module';
import { ConflictResolverService } from './strategy/conflict-resolver.service';
import { LoopDetectorService } from './strategy/loop-detector.service';
import { CustomerSyncService } from './orchestrator/customer-sync.service';
import { CustomerSyncSimplifiedService } from './orchestrator/customer-sync-simplified.service';
import { InitialSyncService } from './orchestrator/initial-sync.service';
import { WebhookValidatorService } from './webhook/webhook-validator.service';
import { WebhookController } from './webhook/webhook.controller';
import { SyncJobProcessor } from './jobs/sync-job.processor';
import { PollJobScheduler } from './jobs/poll-job.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sync',
    }),
    CrmModule,
    FinanceModule,
    DatabaseModule,
  ],
  controllers: [WebhookController],
  providers: [
    // Strategy services
    ConflictResolverService,
    LoopDetectorService,

    // Sync orchestration
    CustomerSyncService, // Original bidirectional sync
    CustomerSyncSimplifiedService, // New CRM→Finance sync
    InitialSyncService, // Initial Finance→CRM import

    // Webhook handling
    WebhookValidatorService,

    // Job processing
    SyncJobProcessor,
    PollJobScheduler,
  ],
  exports: [CustomerSyncService, CustomerSyncSimplifiedService, InitialSyncService],
})
export class SyncModule {}

