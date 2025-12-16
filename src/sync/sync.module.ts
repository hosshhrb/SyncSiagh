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
import { InitialImportUpdatedService } from './orchestrator/initial-import-updated.service';
import { IdentityToFinanceService } from './orchestrator/identity-to-finance.service';
import { WebhookValidatorService } from './webhook/webhook-validator.service';
import { WebhookController } from './webhook/webhook.controller';
import { CrmWebhookController } from './webhook/crm-webhook.controller';
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
  controllers: [WebhookController, CrmWebhookController],
  providers: [
    // Strategy services
    ConflictResolverService,
    LoopDetectorService,

    // Sync orchestration
    CustomerSyncService, // Original bidirectional sync
    CustomerSyncSimplifiedService, // CRM→Finance sync
    InitialSyncService, // Old initial import
    InitialImportUpdatedService, // New initial import with actual CRM APIs
    IdentityToFinanceService, // Identity → Finance sync

    // Webhook handling
    WebhookValidatorService,

    // Job processing
    SyncJobProcessor,
    PollJobScheduler,
  ],
  exports: [
    CustomerSyncService,
    CustomerSyncSimplifiedService,
    InitialSyncService,
    InitialImportUpdatedService,
    IdentityToFinanceService,
  ],
})
export class SyncModule {}

