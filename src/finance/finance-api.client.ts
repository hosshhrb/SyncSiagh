import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { FinanceAuthService } from './finance-auth.service';
import {
  FinanceCustomerDto,
  FinanceCustomerListResponse,
  CreateFinanceCustomerDto,
  UpdateFinanceCustomerDto,
} from './dto/finance-customer.dto';
import {
  FinancePreInvoiceDto,
  FinancePreInvoiceListResponse,
  CreateFinancePreInvoiceDto,
  UpdateFinancePreInvoiceDto,
} from './dto/finance-preinvoice.dto';

@Injectable()
export class FinanceApiClient {
  private readonly logger = new Logger(FinanceApiClient.name);
  private readonly baseUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: FinanceAuthService,
  ) {
    this.baseUrl = this.configService.get<string>('finance.baseUrl') || '';
  }

  /**
   * Generic request method with retry logic and idempotency support
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    idempotencyKey?: string,
    retryCount = 0,
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = await this.authService.getAuthHeaders();

      // Add idempotency key for write operations
      if (idempotencyKey && (method === 'POST' || method === 'PUT')) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      this.logger.debug(`${method} ${url}${idempotencyKey ? ` [${idempotencyKey}]` : ''}`);

      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url,
          headers,
          data,
          timeout: 30000,
        }),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      // Log error details
      this.logger.error(
        `Finance API Error: ${method} ${endpoint}`,
        axiosError.response?.data || axiosError.message,
      );

      // If 401, clear token and retry once
      if (axiosError.response?.status === 401 && retryCount === 0) {
        this.logger.warn('Token expired, re-authenticating...');
        this.authService.clearToken();
        return this.request<T>(method, endpoint, data, idempotencyKey, retryCount + 1);
      }

      // Retry on network errors or 5xx errors
      const shouldRetry =
        retryCount < this.maxRetries &&
        (!axiosError.response || axiosError.response.status >= 500);

      if (shouldRetry) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        this.logger.warn(`Retrying in ${delay}ms... (attempt ${retryCount + 1})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request<T>(method, endpoint, data, idempotencyKey, retryCount + 1);
      }

      throw new Error(
        `Finance API request failed: ${axiosError.message} - ${JSON.stringify(axiosError.response?.data)}`,
      );
    }
  }

  // ==================== Customer APIs ====================

  /**
   * Get list of customers with pagination
   */
  async getCustomers(
    page = 1,
    pageSize = 50,
    filters?: Record<string, any>,
  ): Promise<FinanceCustomerListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...filters,
    });

    return this.request<FinanceCustomerListResponse>('GET', `/customers?${params}`);
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(customerId: string): Promise<FinanceCustomerDto> {
    return this.request<FinanceCustomerDto>('GET', `/customers/${customerId}`);
  }

  /**
   * Create a new customer with idempotency
   */
  async createCustomer(
    customer: CreateFinanceCustomerDto,
    idempotencyKey: string,
  ): Promise<FinanceCustomerDto> {
    this.logger.log(`Creating customer: ${customer.name}`);
    return this.request<FinanceCustomerDto>('POST', '/customers', customer, idempotencyKey);
  }

  /**
   * Update an existing customer with idempotency
   */
  async updateCustomer(
    customerId: string,
    customer: UpdateFinanceCustomerDto,
    idempotencyKey: string,
  ): Promise<FinanceCustomerDto> {
    this.logger.log(`Updating customer: ${customerId}`);
    return this.request<FinanceCustomerDto>(
      'PUT',
      `/customers/${customerId}`,
      customer,
      idempotencyKey,
    );
  }

  /**
   * Get customers updated since a specific date
   */
  async getCustomersUpdatedSince(since: Date): Promise<FinanceCustomerDto[]> {
    const isoDate = since.toISOString();
    const response = await this.request<FinanceCustomerListResponse>(
      'GET',
      `/customers?updatedSince=${isoDate}`,
    );
    return response.data || [];
  }

  // ==================== PreInvoice APIs ====================

  /**
   * Get list of pre-invoices with pagination
   */
  async getPreInvoices(
    page = 1,
    pageSize = 50,
    filters?: Record<string, any>,
  ): Promise<FinancePreInvoiceListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...filters,
    });

    return this.request<FinancePreInvoiceListResponse>('GET', `/preinvoices?${params}`);
  }

  /**
   * Get a single pre-invoice by ID
   */
  async getPreInvoice(invoiceId: string): Promise<FinancePreInvoiceDto> {
    return this.request<FinancePreInvoiceDto>('GET', `/preinvoices/${invoiceId}`);
  }

  /**
   * Create a new pre-invoice with idempotency
   */
  async createPreInvoice(
    invoice: CreateFinancePreInvoiceDto,
    idempotencyKey: string,
  ): Promise<FinancePreInvoiceDto> {
    this.logger.log(`Creating pre-invoice for customer: ${invoice.customerId}`);
    return this.request<FinancePreInvoiceDto>('POST', '/preinvoices', invoice, idempotencyKey);
  }

  /**
   * Update an existing pre-invoice with idempotency
   */
  async updatePreInvoice(
    invoiceId: string,
    invoice: UpdateFinancePreInvoiceDto,
    idempotencyKey: string,
  ): Promise<FinancePreInvoiceDto> {
    this.logger.log(`Updating pre-invoice: ${invoiceId}`);
    return this.request<FinancePreInvoiceDto>(
      'PUT',
      `/preinvoices/${invoiceId}`,
      invoice,
      idempotencyKey,
    );
  }

  /**
   * Get pre-invoices updated since a specific date
   */
  async getPreInvoicesUpdatedSince(since: Date): Promise<FinancePreInvoiceDto[]> {
    const isoDate = since.toISOString();
    const response = await this.request<FinancePreInvoiceListResponse>(
      'GET',
      `/preinvoices?updatedSince=${isoDate}`,
    );
    return response.data || [];
  }
}

