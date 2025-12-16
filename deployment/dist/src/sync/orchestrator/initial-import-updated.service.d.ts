import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmIdentityApiClient } from '../../crm/crm-identity-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
export declare class InitialImportUpdatedService {
    private siaghClient;
    private crmIdentityClient;
    private entityMappingRepo;
    private readonly logger;
    constructor(siaghClient: SiaghApiClient, crmIdentityClient: CrmIdentityApiClient, entityMappingRepo: EntityMappingRepository);
    importCustomersFromFinance(): Promise<{
        imported: number;
        skipped: number;
        errors: number;
    }>;
    private transformSiaghToCrmPerson;
    hasInitialImportCompleted(): Promise<boolean>;
}
