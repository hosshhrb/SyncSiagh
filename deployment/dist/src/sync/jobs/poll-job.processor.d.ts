import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { CrmApiClient } from '../../crm/crm-api.client';
import { FinanceApiClient } from '../../finance/finance-api.client';
export declare class PollJobScheduler {
    private configService;
    private crmClient;
    private financeClient;
    private syncQueue;
    private readonly logger;
    private readonly pollIntervalSeconds;
    private lastPollTime;
    constructor(configService: ConfigService, crmClient: CrmApiClient, financeClient: FinanceApiClient, syncQueue: Queue);
    pollCrmCustomers(): Promise<void>;
    pollFinanceCustomers(): Promise<void>;
    logSyncStats(): Promise<void>;
}
