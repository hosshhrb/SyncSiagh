/**
 * CRM Invoice/PreInvoice DTOs
 * Based on Payamgostar CRM API
 */

export interface CrmInvoiceItemDto {
  id?: string;
  productId?: string;
  productName: string;
  productCode?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice: number;
}

export interface CrmInvoiceDto {
  id: string;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  
  // Customer reference
  customerId: string;
  customerName?: string;
  
  // Financial details
  items: CrmInvoiceItemDto[];
  subtotal: number;
  totalDiscount?: number;
  totalTax?: number;
  totalAmount: number;
  
  // Payment information
  paymentStatus?: string;
  paymentMethod?: string;
  paymentTerms?: string;
  
  // Status
  status?: string;
  description?: string;
  notes?: string;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Custom fields
  customFields?: Record<string, any>;
}

export interface CrmInvoiceListResponse {
  data: CrmInvoiceDto[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

