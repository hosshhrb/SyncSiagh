import { Queue } from 'bullmq';
import { WebhookValidatorService } from './webhook-validator.service';
interface CrmWebhookPayload {
    eventId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    action: string;
    timestamp: string;
    data?: any;
}
export declare class WebhookController {
    private webhookValidator;
    private syncQueue;
    private readonly logger;
    constructor(webhookValidator: WebhookValidatorService, syncQueue: Queue);
    handleCrmWebhook(payload: CrmWebhookPayload, signature: string, rawBody: any): Promise<{
        success: boolean;
        eventId: string;
        message: string;
    }>;
    handleFinanceWebhook(payload: any, signature: string, rawBody: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
