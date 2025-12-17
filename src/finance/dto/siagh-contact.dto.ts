/**
 * Siagh Finance System Contact DTOs
 * Based on actual Siagh API documentation
 */

export interface SiaghContactDto {
  Code?: number;
  NickName?: string;
  FullName: string;
  Gender?: number; // 0=مونث, 1=مذکر
  MobileNo?: string;
  TelNo?: string;
  Email?: string;
  WebsiteAddress?: string;
  Address?: string;
  CodeShahr?: string;
  CodeOstan?: string;
  CountryCode?: string;
  PoCode?: string;
  TpmId?: string;
  Tozihat?: string;
  IsActive?: number;
  tarafType?: number; // 0 = Person, 1 = Organization
}

export interface SiaghSaveFormRequest {
  formId: string;
  ctrlValues: string;
  parameters: string;
  dataRows: string;
  attachments: string;
  postCode: string;
  flowId: string;
}

export interface SiaghSaveFormResponse {
  Errors: Array<{
    ColName: string;
    Group: string;
    ErrorType: string;
    Description: string;
    ErrorCode: number;
    MessageText: string;
    Solution: string;
    HelpIndex: string;
  }>;
  FinalMessages: string[];
  ReturnValue: boolean;
  ReturnCode: string;
  ReturnParams: string;
}

export interface CreateSiaghContactRequest {
  fullname: string;
  nickname?: string;
  gender?: number;
  mobileno?: string;
  telno?: string;
  email?: string;
  websiteaddress?: string;
  address?: string;
  codeshahr?: string;
  codeostan?: string;
  countrycode?: string;
  pocode?: string;
  tpmid?: string;
  tozihat?: string;
  isactive?: number;
  taraftype?: number; // 0 = Person, 1 = Organization
}

