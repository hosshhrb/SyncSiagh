/**
 * Siagh SaveFormData Response DTO
 * Response from POST /BpmsApi/SaveFormData
 */
export interface SiaghError {
  ColName: string;
  Group: string;
  ErrorType: 'ErrSuccs' | 'ErrError' | 'ErrWarning';
  Description: string;
  ErrorCode: number;
  MessageText: string;
  Solution: string;
  HelpIndex: string;
}

export interface SiaghSaveFormResponse {
  Errors: SiaghError[];
  FinalMessages: string[];
  ReturnValue: boolean;
  ReturnCode: string;  // New entity code (contact code or invoice number)
  ReturnParams: string;
}

