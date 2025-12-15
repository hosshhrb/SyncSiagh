/**
 * Finance System Customer DTOs
 */

export interface FinanceCustomerDto {
  id: string;
  code?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  
  // Contact information
  phone?: string;
  mobile?: string;
  email?: string;
  fax?: string;
  
  // Address
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  
  // Financial/Tax information
  nationalCode?: string;
  economicCode?: string;
  registrationNumber?: string;
  taxCode?: string;
  vatNumber?: string;
  
  // Account information
  accountNumber?: string;
  creditLimit?: number;
  currentBalance?: number;
  
  // Classification
  customerType?: string;
  customerGroup?: string;
  paymentTerms?: string;
  
  // Status
  isActive?: boolean;
  notes?: string;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  
  // Custom fields
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

