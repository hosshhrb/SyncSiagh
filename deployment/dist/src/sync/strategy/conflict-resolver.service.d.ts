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
export declare class ConflictResolverService {
    private readonly logger;
    resolve(input: ConflictResolutionInput): ConflictResolutionResult;
    shouldSyncBasedOnTime(lastSyncAt: Date, minIntervalMinutes: number): boolean;
}
