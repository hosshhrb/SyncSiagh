import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InitialImportService } from '../orchestrator/initial-import.service';
import { CrmIdentityToSiaghService } from '../orchestrator/crm-identity-to-siagh.service';
import { CrmInvoiceToSiaghService } from '../orchestrator/crm-invoice-to-siagh.service';
import { CrmQuoteToSiaghService } from '../orchestrator/crm-quote-to-siagh.service';
import { EntityType } from '@prisma/client';
interface WebhookEventJob {
    source: 'CRM' | 'FINANCE';
    eventId: string;
    eventType?: string;
    entityType: string;
    entityId: string;
    identityType?: string;
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
export declare class SyncJobProcessor extends WorkerHost {
    private initialImportService;
    private identitySyncService;
    private invoiceSyncService;
    private quoteSyncService;
    private readonly logger;
    constructor(initialImportService: InitialImportService, identitySyncService: CrmIdentityToSiaghService, invoiceSyncService: CrmInvoiceToSiaghService, quoteSyncService: CrmQuoteToSiaghService);
    process(job: Job<WebhookEventJob | PollSyncJob>): Promise<any>;
    private processWebhookEvent;
    private processCrmIdentityWebhook;
    private processCrmInvoiceWebhook;
    private processCrmQuoteWebhook;
    private processPollSync;
    onCompleted(job: Job): void;
    onFailed(job: Job, error: Error): void;
    onActive(job: Job): void;
}
export {};
