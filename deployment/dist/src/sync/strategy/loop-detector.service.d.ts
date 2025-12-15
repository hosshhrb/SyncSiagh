import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { EntityType } from '@prisma/client';
export declare class LoopDetectorService {
    private entityMappingRepo;
    private readonly logger;
    constructor(entityMappingRepo: EntityMappingRepository);
    isLoop(entityType: EntityType, entityId: string, systemType: 'CRM' | 'FINANCE', currentTransactionId: string): Promise<boolean>;
    isDataUnchanged(entityType: EntityType, entityId: string, systemType: 'CRM' | 'FINANCE', newChecksum: string): Promise<boolean>;
}
