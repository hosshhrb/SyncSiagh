import { WorkerHost } from '@nestjs/bullmq';
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
export declare class SyncJobProcessor extends WorkerHost {
    private initialImportService;
    private readonly logger;
    constructor(initialImportService: InitialImportService);
    process(job: Job<WebhookEventJob | PollSyncJob>): Promise<any>;
    private processWebhookEvent;
    private processCrmIdentityWebhook;
    private processCrmInvoiceWebhook;
    private processPollSync;
    onCompleted(job: Job): void;
    onFailed(job: Job, error: Error): void;
    onActive(job: Job): void;
}
export {};
