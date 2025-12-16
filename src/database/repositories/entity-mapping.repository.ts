import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EntityType, SystemType } from '@prisma/client';

@Injectable()
export class EntityMappingRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find mapping by entity type and ID from either system
   */
  async findByEntityId(entityType: EntityType, systemType: SystemType, entityId: string) {
    const where =
      systemType === 'CRM'
        ? { entityType, crmId: entityId }
        : { entityType, financeId: entityId };

    return this.prisma.entityMapping.findFirst({ where });
  }

  /**
   * Find mapping by both CRM and Finance IDs
   */
  async findByBothIds(entityType: EntityType, crmId: string, financeId: string) {
    return this.prisma.entityMapping.findFirst({
      where: {
        entityType,
        crmId,
        financeId,
      },
    });
  }

  /**
   * Create a new entity mapping
   */
  async create(data: {
    entityType: EntityType;
    crmId?: string;
    financeId?: string;
    lastSyncSource: SystemType;
    lastSyncTransactionId: string;
    crmChecksum?: string;
    financeChecksum?: string;
    crmUpdatedAt?: Date;
    financeUpdatedAt?: Date;
  }) {
    return this.prisma.entityMapping.create({
      data: {
        ...data,
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Update an existing entity mapping
   */
  async update(
    id: string,
    data: {
      crmId?: string;
      financeId?: string;
      lastSyncSource?: SystemType;
      lastSyncTransactionId?: string;
      crmChecksum?: string;
      financeChecksum?: string;
      crmUpdatedAt?: Date;
      financeUpdatedAt?: Date;
    },
  ) {
    return this.prisma.entityMapping.update({
      where: { id },
      data: {
        ...data,
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Get all mappings for an entity type that haven't been synced recently
   */
  async findStaleForPolling(entityType: EntityType, olderThanMinutes: number) {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    return this.prisma.entityMapping.findMany({
      where: {
        entityType,
        lastSyncAt: {
          lt: cutoffTime,
        },
      },
      orderBy: {
        lastSyncAt: 'asc',
      },
      take: 100, // Limit batch size
    });
  }

  /**
   * Get mapping by ID
   */
  async findById(id: string) {
    return this.prisma.entityMapping.findUnique({
      where: { id },
    });
  }

  /**
   * Delete a mapping (rarely used)
   */
  async delete(id: string) {
    return this.prisma.entityMapping.delete({
      where: { id },
    });
  }

  /**
   * Find all mappings for an entity type
   */
  async findAll(entityType: EntityType) {
    return this.prisma.entityMapping.findMany({
      where: { entityType },
    });
  }

  /**
   * Count mappings for an entity type
   */
  async count(entityType: EntityType) {
    return this.prisma.entityMapping.count({
      where: { entityType },
    });
  }
}

