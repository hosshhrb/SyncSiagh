import { CrmIdentityApiClient } from '../../crm/crm-identity-api.client';
import { SiaghApiClient } from '../../finance/siagh-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
export declare class CrmIdentityToSiaghService {
    private crmIdentityClient;
    private siaghClient;
    private entityMappingRepo;
    private syncLogRepo;
    private readonly logger;
    constructor(crmIdentityClient: CrmIdentityApiClient, siaghClient: SiaghApiClient, entityMappingRepo: EntityMappingRepository, syncLogRepo: SyncLogRepository);
    syncIdentity(identityId: string, identityType: 'Person' | 'Organization', triggerPayload?: any): Promise<void>;
    private transformCrmToSiagh;
}
