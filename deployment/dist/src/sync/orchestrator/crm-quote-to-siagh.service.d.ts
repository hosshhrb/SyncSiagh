import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmApiClient } from '../../crm/crm-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { CrmQuoteDto } from '../../crm/dto/crm-quote.dto';
export declare class CrmQuoteToSiaghService {
    private siaghClient;
    private crmApiClient;
    private entityMappingRepo;
    private syncLogRepo;
    private readonly logger;
    constructor(siaghClient: SiaghApiClient, crmApiClient: CrmApiClient, entityMappingRepo: EntityMappingRepository, syncLogRepo: SyncLogRepository);
    syncQuote(quoteId: string, quoteData?: CrmQuoteDto, triggerPayload?: any): Promise<void>;
    private extractSaleModelCode;
    private transformCrmToSiagh;
    private calculateTotal;
}
