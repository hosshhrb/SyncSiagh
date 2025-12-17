/**
 * Siagh Finance User DTO
 * Based on actual API response from /api/Sgh/GEN/Gn_Web_Users/GetAll
 */
export interface SiaghUserDto {
  RecordId: string;          // Legacy ID (kept for compatibility)
  TpmId: string;             // Unique ID - USE THIS FOR MAPPING
  Code: number;              // Siagh code
  Name: string;              // Full name
  NickName: string | null;
  NationalCode: string | null;
  MobileNo: string | null;
  MobileNo2: string | null;
  TelNo: string | null;
  TelNo2: string | null;
  Email: string | null;
  Email2: string | null;
  Address: string | null;
  PostalCode: string | null;
  CityCode: string | null;
  CountryCode: string | null;
  Gender: string | null;
  BirthDate: string | null;
  FatherName: string | null;
  Description: string | null;
  WebSiteAddress: string | null;
  IsActive: boolean;
  IsAdminUser: boolean;
  TowardType: boolean;       // true = Person, false = Organization (when reading from Siagh)
  tarafType: number;         // 0 = Person, 1 = Organization (when writing to Siagh)
  RegDate: string | null;
  ExpireDate: string | null;
  ParentCode: number | null;
  AccountPartyCode: number | null;
  GeographicCode: string | null;
  FraternityCode: string | null;
  JobTypeCode: string | null;
  TrackingCode: string | null;
  CodeRoshd: string | null;
  Coin: number | null;
  Confirm: boolean;
  GiveCoinToParentCode: boolean;
  HasDisCount: boolean;
  img: string | null;
  Picture: string | null;
  PreName: string | null;
  RepresentativeId: string | null;
  OrgField: string | null;
  Password: string | null;
}

/**
 * Siagh Login Response
 */
export interface SiaghLoginResponse {
  Token: string;
  SessionId: string;
  UserCode: number;
  UserName: string;
  ContactCode: number;
  ContactName: string;
  FiscalYear: number;
  BranchCode: number;
  BranchName: string;
  IsAdminUser: boolean;
  MobileNo: string;
  SystemDate: string;
  SystemTime: string;
}

