export interface FinanceCustomerDto {
    id: string;
    code?: string;
    name: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    fax?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    nationalCode?: string;
    economicCode?: string;
    registrationNumber?: string;
    taxCode?: string;
    vatNumber?: string;
    accountNumber?: string;
    creditLimit?: number;
    currentBalance?: number;
    customerType?: string;
    customerGroup?: string;
    paymentTerms?: string;
    isActive?: boolean;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    customFields?: Record<string, any>;
}
export interface FinanceCustomerListResponse {
    data: FinanceCustomerDto[];
    total?: number;
    page?: number;
    pageSize?: number;
}
export interface CreateFinanceCustomerDto {
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
    vatNumber?: string;
    customerType?: string;
    customerGroup?: string;
    paymentTerms?: string;
    creditLimit?: number;
    notes?: string;
    customFields?: Record<string, any>;
}
export interface UpdateFinanceCustomerDto extends Partial<CreateFinanceCustomerDto> {
    id: string;
}
