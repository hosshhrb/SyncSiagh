import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { FinanceAuthService } from './finance-auth.service';
import { FinanceCustomerDto, FinanceCustomerListResponse, CreateFinanceCustomerDto, UpdateFinanceCustomerDto } from './dto/finance-customer.dto';
import { FinancePreInvoiceDto, FinancePreInvoiceListResponse, CreateFinancePreInvoiceDto, UpdateFinancePreInvoiceDto } from './dto/finance-preinvoice.dto';
export declare class FinanceApiClient {
    private configService;
    private httpService;
    private authService;
    private readonly logger;
    private readonly baseUrl;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor(configService: ConfigService, httpService: HttpService, authService: FinanceAuthService);
    private request;
    getCustomers(page?: number, pageSize?: number, filters?: Record<string, any>): Promise<FinanceCustomerListResponse>;
    getCustomer(customerId: string): Promise<FinanceCustomerDto>;
    createCustomer(customer: CreateFinanceCustomerDto, idempotencyKey: string): Promise<FinanceCustomerDto>;
    updateCustomer(customerId: string, customer: UpdateFinanceCustomerDto, idempotencyKey: string): Promise<FinanceCustomerDto>;
    getCustomersUpdatedSince(since: Date): Promise<FinanceCustomerDto[]>;
    getPreInvoices(page?: number, pageSize?: number, filters?: Record<string, any>): Promise<FinancePreInvoiceListResponse>;
    getPreInvoice(invoiceId: string): Promise<FinancePreInvoiceDto>;
    createPreInvoice(invoice: CreateFinancePreInvoiceDto, idempotencyKey: string): Promise<FinancePreInvoiceDto>;
    updatePreInvoice(invoiceId: string, invoice: UpdateFinancePreInvoiceDto, idempotencyKey: string): Promise<FinancePreInvoiceDto>;
    getPreInvoicesUpdatedSince(since: Date): Promise<FinancePreInvoiceDto[]>;
}
