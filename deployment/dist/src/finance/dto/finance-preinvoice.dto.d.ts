export interface FinancePreInvoiceItemDto {
    id?: string;
    productId?: string;
    productCode?: string;
    productName: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    discountPercent?: number;
    taxAmount?: number;
    taxPercent?: number;
    lineTotal: number;
}
export interface FinancePreInvoiceDto {
    id: string;
    invoiceNumber?: string;
    referenceNumber?: string;
    invoiceDate: string;
    dueDate?: string;
    customerId: string;
    customerName?: string;
    customerCode?: string;
    items: FinancePreInvoiceItemDto[];
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    totalAmount: number;
    paidAmount?: number;
    remainingAmount?: number;
    status?: string;
    invoiceType?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    paymentTerms?: string;
    description?: string;
    notes?: string;
    internalNotes?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    customFields?: Record<string, any>;
}
export interface FinancePreInvoiceListResponse {
    data: FinancePreInvoiceDto[];
    total?: number;
    page?: number;
    pageSize?: number;
}
export interface CreateFinancePreInvoiceDto {
    customerId: string;
    invoiceDate: string;
    dueDate?: string;
    items: FinancePreInvoiceItemDto[];
    description?: string;
    notes?: string;
    paymentTerms?: string;
    customFields?: Record<string, any>;
}
export interface UpdateFinancePreInvoiceDto extends Partial<CreateFinancePreInvoiceDto> {
    id: string;
}
