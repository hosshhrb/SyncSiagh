import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SyncStatus, SystemType } from '@prisma/client';
import { SyncDirection, TriggerType } from '../../common/types/sync.types';

export interface CreateSyncLogDto {
  transactionId: string;
  entityMappingId?: string;  // Optional - may not exist yet for new entities
  direction: SyncDirection;
  status: SyncStatus;
  triggerType: TriggerType;
  triggerPayload?: any;
  sourceSystem: SystemType;
  targetSystem: SystemType;
  sourceEntityId: string;
  targetEntityId?: string;
  sourceData: any;
  targetDataBefore?: any;
  targetDataAfter?: any;
  errorMessage?: string;
  errorStack?: string;
}

@Injectable()
export class SyncLogRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new sync log entry
   */
  async create(data: CreateSyncLogDto) {
    return this.prisma.syncLog.create({
      data: {
        ...data,
        startedAt: new Date(),
      },
    });
  }

  /**
   * Update sync log
   */
  async update(id: string, data: Partial<CreateSyncLogDto>) {
    return this.prisma.syncLog.update({
      where: { id },
      data,
    });
  }

  /**
   * Update sync log with completion data
   */
  async complete(
    id: string,
    data: {
      status: SyncStatus;
      targetEntityId?: string;
      targetDataAfter?: any;
      errorMessage?: string;
      errorStack?: string;
    },
  ) {
    const startedLog = await this.prisma.syncLog.findUnique({ where: { id } });
    const durationMs = startedLog ? Date.now() - startedLog.startedAt.getTime() : null;

    return this.prisma.syncLog.update({
      where: { id },
      data: {
        ...data,
        completedAt: new Date(),
        durationMs,
      },
    });
  }

  /**
   * Increment retry count
   */
  async incrementRetry(id: string) {
    return this.prisma.syncLog.update({
      where: { id },
      data: {
        retryCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Find sync logs by transaction ID
   */
  async findByTransactionId(transactionId: string) {
    return this.prisma.syncLog.findMany({
      where: { transactionId },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Find recent sync logs for an entity mapping
   */
  async findByEntityMapping(entityMappingId: string, limit = 10) {
    return this.prisma.syncLog.findMany({
      where: { entityMappingId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Find failed syncs that need retry
   */
  async findFailedForRetry(maxRetries: number) {
    return this.prisma.syncLog.findMany({
      where: {
        status: SyncStatus.FAILED,
        retryCount: {
          lt: maxRetries,
        },
      },
      orderBy: { startedAt: 'asc' },
      take: 50,
    });
  }

  /**
   * Get sync statistics
   */
  async getStats(hoursBack = 24) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const [total, success, failed, inProgress] = await Promise.all([
      this.prisma.syncLog.count({ where: { startedAt: { gte: since } } }),
      this.prisma.syncLog.count({
        where: { startedAt: { gte: since }, status: SyncStatus.SUCCESS },
      }),
      this.prisma.syncLog.count({
        where: { startedAt: { gte: since }, status: SyncStatus.FAILED },
      }),
      this.prisma.syncLog.count({
        where: { startedAt: { gte: since }, status: SyncStatus.IN_PROGRESS },
      }),
    ]);

    return { total, success, failed, inProgress };
  }
}

