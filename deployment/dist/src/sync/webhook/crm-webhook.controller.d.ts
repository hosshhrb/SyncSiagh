import { Request, Response } from 'express';
import { Queue } from 'bullmq';
export declare class CrmWebhookController {
    private syncQueue;
    private readonly logger;
    constructor(syncQueue: Queue);
    handleIdentityWebhook(payload: any, headers: Record<string, string>, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    handleInvoiceWebhook(payload: any, headers: Record<string, string>, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    handleTestWebhook(payload: any, headers: Record<string, string>, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
