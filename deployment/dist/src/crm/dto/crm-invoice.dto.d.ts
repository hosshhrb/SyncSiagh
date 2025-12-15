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
    customerId: string;
    customerName?: string;
    items: CrmInvoiceItemDto[];
    subtotal: number;
    totalDiscount?: number;
    totalTax?: number;
    totalAmount: number;
    paymentStatus?: string;
    paymentMethod?: string;
    paymentTerms?: string;
    status?: string;
    description?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    customFields?: Record<string, any>;
}
export interface CrmInvoiceListResponse {
    data: CrmInvoiceDto[];
    totalCount?: number;
    pageNumber?: number;
    pageSize?: number;
}
