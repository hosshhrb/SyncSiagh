import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmIdentityApiClient } from '../../crm/crm-identity-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
interface ImportResult {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
    details: ImportDetail[];
}
interface ImportDetail {
    recordId: string;
    name: string;
    type: 'Person' | 'Organization';
    status: 'imported' | 'skipped' | 'error';
    crmId?: string;
    reason?: string;
}
export declare class InitialImportService {
    private siaghClient;
    private crmIdentityClient;
    private entityMappingRepo;
    private readonly logger;
    private readonly BATCH_SIZE;
    constructor(siaghClient: SiaghApiClient, crmIdentityClient: CrmIdentityApiClient, entityMappingRepo: EntityMappingRepository);
    runInitialImport(): Promise<ImportResult>;
    private importSingleUser;
    private transformToPerson;
    private transformToOrganization;
}
export {};
