import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { CrmAuthService } from './crm-auth.service';
import {
  CrmCustomerDto,
  CrmCustomerListResponse,
  CreateCrmCustomerDto,
  UpdateCrmCustomerDto,
} from './dto/crm-customer.dto';
import { CrmInvoiceDto, CrmInvoiceListResponse } from './dto/crm-invoice.dto';
import { CrmQuoteDto, CrmQuoteListResponse } from './dto/crm-quote.dto';

@Injectable()
export class CrmApiClient {
  private readonly logger = new Logger(CrmApiClient.name);
  private readonly baseUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: CrmAuthService,
  ) {
    this.baseUrl = this.configService.get<string>('crm.baseUrl') || '';
  }

  /**
   * Generic request method with retry logic
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    retryCount = 0,
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = await this.authService.getAuthHeaders();

      this.logger.debug(`${method} ${url}`);

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
        `CRM API Error: ${method} ${endpoint}`,
        axiosError.response?.data || axiosError.message,
      );

      // If 401, clear token and retry once
      if (axiosError.response?.status === 401 && retryCount === 0) {
        this.logger.warn('CRM token expired, re-authenticating...');
        this.authService.clearToken();
        return this.request<T>(method, endpoint, data, retryCount + 1);
      }

      // Retry on network errors or 5xx errors
      const shouldRetry =
        retryCount < this.maxRetries &&
        (!axiosError.response || axiosError.response.status >= 500);

      if (shouldRetry) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        this.logger.warn(`Retrying in ${delay}ms... (attempt ${retryCount + 1})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request<T>(method, endpoint, data, retryCount + 1);
      }

      throw new Error(
        `CRM API request failed: ${axiosError.message} - ${JSON.stringify(axiosError.response?.data)}`,
      );
    }
  }

  // ==================== Customer APIs ====================

  /**
   * Get list of customers with pagination
   */
  async getCustomers(
    pageNumber = 1,
    pageSize = 50,
    filters?: Record<string, any>,
  ): Promise<CrmCustomerListResponse> {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
      ...filters,
    });

    return this.request<CrmCustomerListResponse>('GET', `/crm/customers?${params}`);
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(customerId: string): Promise<CrmCustomerDto> {
    return this.request<CrmCustomerDto>('GET', `/crm/customers/${customerId}`);
  }

  /**
   * Create a new customer
   */
  async createCustomer(customer: CreateCrmCustomerDto): Promise<CrmCustomerDto> {
    this.logger.log(`Creating customer: ${customer.name}`);
    return this.request<CrmCustomerDto>('POST', '/crm/customers', customer);
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(customerId: string, customer: UpdateCrmCustomerDto): Promise<CrmCustomerDto> {
    this.logger.log(`Updating customer: ${customerId}`);
    return this.request<CrmCustomerDto>('PUT', `/crm/customers/${customerId}`, customer);
  }

  /**
   * Get customers updated since a specific date
   */
  async getCustomersUpdatedSince(since: Date): Promise<CrmCustomerDto[]> {
    const isoDate = since.toISOString();
    const response = await this.request<CrmCustomerListResponse>(
      'GET',
      `/crm/customers?updatedSince=${isoDate}`,
    );
    return response.data || [];
  }

  // ==================== Invoice APIs ====================

  /**
   * Get list of invoices with pagination
   */
  async getInvoices(
    pageNumber = 1,
    pageSize = 50,
    filters?: Record<string, any>,
  ): Promise<CrmInvoiceListResponse> {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
      ...filters,
    });

    return this.request<CrmInvoiceListResponse>('GET', `/crm/invoices?${params}`);
  }

  /**
   * Get a single invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<CrmInvoiceDto> {
    return this.request<CrmInvoiceDto>('GET', `/crm/invoices/${invoiceId}`);
  }

  /**
   * Get invoices updated since a specific date
   */
  async getInvoicesUpdatedSince(since: Date): Promise<CrmInvoiceDto[]> {
    const isoDate = since.toISOString();
    const response = await this.request<CrmInvoiceListResponse>(
      'GET',
      `/crm/invoices?updatedSince=${isoDate}`,
    );
    return response.data || [];
  }

  // ==================== Quote APIs ====================

  /**
   * Get a single quote by ID
   * Uses the actual CRM endpoint: /api/v2/crmobject/quote/sales/get
   */
  async getQuote(quoteId: string): Promise<CrmQuoteDto> {
    this.logger.log(`Fetching quote: ${quoteId}`);
    return this.request<CrmQuoteDto>(
      'POST',
      '/api/v2/crmobject/quote/sales/get',
      { id: quoteId },
    );
  }

  /**
   * Get list of quotes with pagination
   */
  async getQuotes(
    pageNumber = 1,
    pageSize = 50,
    filters?: Record<string, any>,
  ): Promise<CrmQuoteListResponse> {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
      ...filters,
    });

    return this.request<CrmQuoteListResponse>('GET', `/crm/quotes?${params}`);
  }

  /**
   * Get quotes updated since a specific date
   */
  async getQuotesUpdatedSince(since: Date): Promise<CrmQuoteDto[]> {
    const isoDate = since.toISOString();
    const response = await this.request<CrmQuoteListResponse>(
      'GET',
      `/crm/quotes?updatedSince=${isoDate}`,
    );
    return response.data || [];
  }

  // ==================== Webhook APIs ====================

  /**
   * Check if webhooks are supported
   */
  async checkWebhookSupport(): Promise<boolean> {
    try {
      await this.request('GET', '/webhooks');
      this.logger.log('✅ CRM webhooks are supported');
      return true;
    } catch (error) {
      this.logger.warn('⚠️ CRM webhooks may not be supported');
      return false;
    }
  }

  /**
   * Register a webhook subscription
   */
  async registerWebhook(webhookUrl: string, events: string[]): Promise<any> {
    this.logger.log(`Registering webhook: ${webhookUrl}`);
    return this.request('POST', '/webhooks', {
      url: webhookUrl,
      events,
    });
  }

  /**
   * List webhook subscriptions
   */
  async listWebhooks(): Promise<any[]> {
    return this.request<any[]>('GET', '/webhooks');
  }
}

