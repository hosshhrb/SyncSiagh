import { CrmApiClient } from '../../crm/crm-api.client';
import { FinanceSiaghAdapter } from '../../finance/finance-siagh.adapter';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { LoopDetectorService } from '../strategy/loop-detector.service';
import { TriggerType } from '../../common/types/sync.types';
export declare class CustomerSyncSimplifiedService {
    private crmClient;
    private siaghAdapter;
    private entityMappingRepo;
    private syncLogRepo;
    private loopDetector;
    private readonly logger;
    constructor(crmClient: CrmApiClient, siaghAdapter: FinanceSiaghAdapter, entityMappingRepo: EntityMappingRepository, syncLogRepo: SyncLogRepository, loopDetector: LoopDetectorService);
    syncCustomerToFinance(crmCustomerId: string, triggerType: TriggerType, triggerPayload?: any): Promise<void>;
    private transformCrmToFinance;
}
