export interface CrmIdentitySearchRequest {
    pageNumber: number;
    pageSize: number;
    searchTerm?: string;
    identityType?: number;
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
