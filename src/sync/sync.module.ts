import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrmModule } from '../crm/crm.module';
import { FinanceModule } from '../finance/finance.module';
import { DatabaseModule } from '../database/database.module';
import { LoopDetectorService } from './strategy/loop-detector.service';
import { InitialImportService } from './orchestrator/initial-import.service';
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
    LoopDetectorService,

    // Sync orchestration
    InitialImportService, // Optimized initial import from Siagh to CRM

    // Webhook handling
    WebhookValidatorService,

    // Job processing
    SyncJobProcessor,
    PollJobScheduler,
  ],
  exports: [
    InitialImportService,
  ],
})
export class SyncModule {}
