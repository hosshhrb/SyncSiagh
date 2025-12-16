/**
 * CRM Identity DTOs
 * Base URL: http://172.16.16.16
 */

export interface CrmIdentitySearchRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  identityType?: number; // 1=Person, 2=Organization
}

export interface CrmIdentitySimpleDto {
  identityId: string;
  nickName: string;
  customerNo: string;
}

export interface CrmIdentityListResponse {
  data: CrmIdentitySimpleDto[];
  totalCount?: number;
}

