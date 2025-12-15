import { Injectable, Logger } from '@nestjs/common';

export interface ConflictResolutionInput {
  sourceUpdatedAt: Date | string;
  targetUpdatedAt: Date | string;
  sourceSystem: string;
  targetSystem: string;
}

export interface ConflictResolutionResult {
  shouldSync: boolean;
  winner: 'source' | 'target';
  reason: string;
}

@Injectable()
export class ConflictResolverService {
  private readonly logger = new Logger(ConflictResolverService.name);

  /**
   * Resolve conflicts using CRM-priority strategy
   * CRM ALWAYS WINS - Finance (Siagh) is updated to match CRM
   */
  resolve(input: ConflictResolutionInput): ConflictResolutionResult {
    const { sourceSystem, targetSystem } = input;

    // If source is CRM, always sync (CRM wins)
    if (sourceSystem === 'CRM') {
      this.logger.log(`✅ CRM is source, syncing to ${targetSystem} (CRM always wins)`);
      return {
        shouldSync: true,
        winner: 'source',
        reason: 'CRM priority - CRM always wins conflicts',
      };
    }

    // If source is Finance and target is CRM, don't sync
    // (This should rarely happen after initial import)
    if (sourceSystem === 'FINANCE' && targetSystem === 'CRM') {
      this.logger.log(
        `⏭️ Finance → CRM sync attempted, but CRM has priority. Skipping.`,
      );
      return {
        shouldSync: false,
        winner: 'target',
        reason: 'CRM priority - Finance changes don\'t override CRM',
      };
    }

    // Default: allow sync
    return {
      shouldSync: true,
      winner: 'source',
      reason: 'No conflict detected',
    };
  }

  /**
   * Check if enough time has passed since last sync to avoid unnecessary syncs
   */
  shouldSyncBasedOnTime(lastSyncAt: Date, minIntervalMinutes: number): boolean {
    const now = Date.now();
    const lastSync = new Date(lastSyncAt).getTime();
    const intervalMs = minIntervalMinutes * 60 * 1000;

    return now - lastSync >= intervalMs;
  }
}

