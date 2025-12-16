import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmApiClient } from '../../crm/crm-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { CrmInvoiceDto } from '../../crm/dto/crm-invoice.dto';
export declare class CrmInvoiceToSiaghService {
    private siaghClient;
    private crmApiClient;
    private entityMappingRepo;
    private syncLogRepo;
    private readonly logger;
    constructor(siaghClient: SiaghApiClient, crmApiClient: CrmApiClient, entityMappingRepo: EntityMappingRepository, syncLogRepo: SyncLogRepository);
    syncInvoice(invoiceId: string, invoiceData?: CrmInvoiceDto, triggerPayload?: any): Promise<void>;
    private transformCrmToSiagh;
    private calculateTotal;
}
