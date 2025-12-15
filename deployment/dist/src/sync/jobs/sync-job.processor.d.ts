import { WorkerHost } from '@nestjs/bullmq';
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
export declare class SyncJobProcessor extends WorkerHost {
    private customerSyncService;
    private readonly logger;
    constructor(customerSyncService: CustomerSyncService);
    process(job: Job<WebhookEventJob | PollSyncJob>): Promise<any>;
    private processWebhookEvent;
    private processPollSync;
    onCompleted(job: Job): void;
    onFailed(job: Job, error: Error): void;
    onActive(job: Job): void;
}
export {};
