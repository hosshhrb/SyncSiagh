import { CrmApiClient } from '../../crm/crm-api.client';
import { FinanceApiClient } from '../../finance/finance-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { ConflictResolverService } from '../strategy/conflict-resolver.service';
import { LoopDetectorService } from '../strategy/loop-detector.service';
import { TriggerType } from '../../common/types/sync.types';
export declare class CustomerSyncService {
    private crmClient;
    private financeClient;
    private entityMappingRepo;
    private syncLogRepo;
    private conflictResolver;
    private loopDetector;
    private readonly logger;
    constructor(crmClient: CrmApiClient, financeClient: FinanceApiClient, entityMappingRepo: EntityMappingRepository, syncLogRepo: SyncLogRepository, conflictResolver: ConflictResolverService, loopDetector: LoopDetectorService);
    syncFromCrmToFinance(crmCustomerId: string, triggerType: TriggerType, triggerPayload?: any): Promise<void>;
    syncFromFinanceToCrm(financeCustomerId: string, triggerType: TriggerType, triggerPayload?: any): Promise<void>;
    private transformCrmToFinance;
    private transformFinanceToCrm;
}
