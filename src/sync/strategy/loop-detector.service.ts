import { Injectable, Logger } from '@nestjs/common';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { EntityType } from '@prisma/client';

@Injectable()
export class LoopDetectorService {
  private readonly logger = new Logger(LoopDetectorService.name);

  constructor(private entityMappingRepo: EntityMappingRepository) {}

  /**
   * Check if a sync would create a loop
   * Returns true if this change was initiated by our own previous sync
   */
  async isLoop(
    entityType: EntityType,
    entityId: string,
    systemType: 'CRM' | 'FINANCE',
    currentTransactionId: string,
  ): Promise<boolean> {
    // Get the entity mapping
    const mapping = await this.entityMappingRepo.findByEntityId(entityType, systemType, entityId);

    if (!mapping) {
      // No mapping exists, definitely not a loop
      return false;
    }

    // Check if the last sync transaction ID matches the current one
    // This would indicate we're trying to sync back a change we just made
    if (mapping.lastSyncTransactionId === currentTransactionId) {
      this.logger.warn(
        `🔄 Loop detected: Transaction ${currentTransactionId} already synced this entity`,
      );
      return true;
    }

    // Check timestamps - if the entity was just synced very recently (within last 10 seconds)
    // and we're trying to sync it again, it might be a loop
    const lastSyncTime = mapping.lastSyncAt.getTime();
    const timeSinceSync = Date.now() - lastSyncTime;
    const tenSecondsInMs = 10000;

    if (timeSinceSync < tenSecondsInMs) {
      this.logger.warn(
        `🔄 Potential loop detected: Entity was synced ${timeSinceSync}ms ago, skipping`,
      );
      return true;
    }

    return false;
  }

  /**
   * More advanced loop detection using checksum comparison
   * Returns true if the data hasn't actually changed
   */
  async isDataUnchanged(
    entityType: EntityType,
    entityId: string,
    systemType: 'CRM' | 'FINANCE',
    newChecksum: string,
  ): Promise<boolean> {
    const mapping = await this.entityMappingRepo.findByEntityId(entityType, systemType, entityId);

    if (!mapping) {
      return false;
    }

    const storedChecksum = systemType === 'CRM' ? mapping.crmChecksum : mapping.financeChecksum;

    if (storedChecksum === newChecksum) {
      this.logger.log(`✓ Data unchanged (checksum match), skipping sync`);
      return true;
    }

    return false;
  }
}

