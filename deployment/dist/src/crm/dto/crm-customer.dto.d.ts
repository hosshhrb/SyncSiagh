export interface CrmCustomerDto {
    id: string;
    code?: string;
    name: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    nationalCode?: string;
    economicCode?: string;
    registrationNumber?: string;
    taxCode?: string;
    customerType?: string;
    category?: string;
    tags?: string[];
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    customFields?: Record<string, any>;
}
export interface CrmCustomerListResponse {
    data: CrmCustomerDto[];
    totalCount?: number;
    pageNumber?: number;
    pageSize?: number;
}
export interface CreateCrmCustomerDto {
    name: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    nationalCode?: string;
    economicCode?: string;
    registrationNumber?: string;
    taxCode?: string;
    customerType?: string;
    category?: string;
    description?: string;
    customFields?: Record<string, any>;
}
export interface UpdateCrmCustomerDto extends Partial<CreateCrmCustomerDto> {
    id: string;
}
