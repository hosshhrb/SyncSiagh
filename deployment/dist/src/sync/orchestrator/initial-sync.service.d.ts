import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmApiClient } from '../../crm/crm-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
export declare class InitialSyncService {
    private siaghClient;
    private crmClient;
    private entityMappingRepo;
    private readonly logger;
    constructor(siaghClient: SiaghApiClient, crmClient: CrmApiClient, entityMappingRepo: EntityMappingRepository);
    importCustomersFromFinance(): Promise<{
        imported: number;
        skipped: number;
        errors: number;
    }>;
    hasInitialImportCompleted(): Promise<boolean>;
}
