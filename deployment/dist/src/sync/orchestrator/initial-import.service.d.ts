import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmIdentityApiClient } from '../../crm/crm-identity-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SiaghUserDto } from '../../finance/dto/siagh-user.dto';
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
    crmIdentityId?: string;
    reason?: string;
    error?: string;
    siaghContact?: SiaghUserDto;
}
export declare class InitialImportService {
    private siaghClient;
    private crmIdentityClient;
    private entityMappingRepo;
    private readonly logger;
    private readonly BATCH_SIZE;
    constructor(siaghClient: SiaghApiClient, crmIdentityClient: CrmIdentityApiClient, entityMappingRepo: EntityMappingRepository);
    importSiaghContactsToCrm(maxRecords?: number): Promise<ImportResult>;
    runInitialImport(maxRecords?: number): Promise<ImportResult>;
    private importSingleUser;
    private transformToPerson;
    private transformToOrganization;
}
export {};
