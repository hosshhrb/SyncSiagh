export enum SystemType {
  CRM = 'CRM',
  FINANCE = 'FINANCE',
}

export enum EntityType {
  CUSTOMER = 'CUSTOMER',
  PREINVOICE = 'PREINVOICE',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT',
}

export type SyncDirection = 'CRM_TO_FINANCE' | 'FINANCE_TO_CRM';

export type TriggerType = 'WEBHOOK' | 'POLL' | 'MANUAL';

export interface SyncContext {
  transactionId: string;
  direction: SyncDirection;
  triggerType: TriggerType;
  triggerPayload?: any;
}

