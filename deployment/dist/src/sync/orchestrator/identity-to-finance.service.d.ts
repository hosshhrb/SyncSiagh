import { CrmIdentityApiClient } from '../../crm/crm-identity-api.client';
import { FinanceSiaghAdapter } from '../../finance/finance-siagh.adapter';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { LoopDetectorService } from '../strategy/loop-detector.service';
export declare class IdentityToFinanceService {
    private crmIdentityClient;
    private siaghAdapter;
    private entityMappingRepo;
    private syncLogRepo;
    private loopDetector;
    private readonly logger;
    constructor(crmIdentityClient: CrmIdentityApiClient, siaghAdapter: FinanceSiaghAdapter, entityMappingRepo: EntityMappingRepository, syncLogRepo: SyncLogRepository, loopDetector: LoopDetectorService);
    syncIdentityToFinance(identityId: string, identityType: 'Person' | 'Organization', triggerPayload?: any): Promise<void>;
    private transformCrmToFinance;
}
