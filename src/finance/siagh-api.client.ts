import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { FinanceAuthService } from './finance-auth.service';
import {
  SiaghContactDto,
  SiaghSaveFormRequest,
  SiaghSaveFormResponse,
  CreateSiaghContactRequest,
} from './dto/siagh-contact.dto';
import {
  CreateSiaghPreInvoiceRequest,
  SiaghPreInvoiceDto,
} from './dto/siagh-preinvoice.dto';

/**
 * Siagh Finance System API Client
 * Implements the actual Siagh API structure
 */
@Injectable()
export class SiaghApiClient {
  private readonly logger = new Logger(SiaghApiClient.name);
  private readonly baseUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  // Form IDs from Siagh documentation
  private readonly CONTACT_FORM_ID = '2BFDA';
  private readonly PREINVOICE_FORM_ID = '43D81';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: FinanceAuthService,
  ) {
    this.baseUrl = this.configService.get<string>('finance.baseUrl') || '';
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

      this.logger.error(
        `Siagh API Error: ${method} ${endpoint}`,
        axiosError.response?.data || axiosError.message,
      );

      // If 401, clear session and retry once
      if (axiosError.response?.status === 401 && retryCount === 0) {
        this.logger.warn('Session expired, re-authenticating...');
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
        `Siagh API request failed: ${axiosError.message} - ${JSON.stringify(axiosError.response?.data)}`,
      );
    }
  }

  // ==================== Contact/Customer APIs ====================

  /**
   * Get all contacts from Siagh
   * Endpoint: GET /api/Sgh/GEN/Gn_Web_Users/GetAll
   */
  async getAllContacts(filter?: Record<string, any>): Promise<SiaghContactDto[]> {
    return this.request<SiaghContactDto[]>(
      'POST',
      '/api/Sgh/GEN/Gn_Web_Users/GetAll',
      filter || {},
    );
  }

  /**
   * Get contacts by mobile number
   */
  async getContactByMobile(mobileNo: string): Promise<SiaghContactDto[]> {
    return this.getAllContacts({ MobileNo: mobileNo });
  }

  /**
   * Get contacts by telephone number
   */
  async getContactByTel(telNo: string): Promise<SiaghContactDto[]> {
    return this.getAllContacts({ TelNo: telNo });
  }

  /**
   * Create a new contact in Siagh
   * Endpoint: POST /BpmsApi/SaveFormData
   */
  async createContact(
    contact: CreateSiaghContactRequest,
    idempotencyKey: string,
  ): Promise<SiaghSaveFormResponse> {
    this.logger.log(`Creating Siagh contact: ${contact.fullname}`);

    // Build ctrlValues string according to Siagh format
    const ctrlValues = [
      `NickName=dbgrid1.#nickname#`,
      `gn_web_users.isactive=${contact.isactive ?? 1}`,
      `gn_web_users.gender=${contact.gender ?? ''}`,
      `gn_web_users.websiteaddress=${contact.websiteaddress ?? ''}`,
      `gn_web_users.pocode=${contact.pocode ?? ''}`,
      `gn_web_users.codeostan=${contact.codeostan ?? ''}`,
      `gn_web_users.address=${contact.address ?? ''}`,
      `gn_web_users.codeshahr=${contact.codeshahr ?? ''}`,
      `gn_web_users.countrycode=${contact.countrycode ?? ''}`,
      `gn_web_users.email=${contact.email ?? ''}`,
      `gn_web_users.fullname=${contact.fullname}`,
      `gn_web_users.mobileno=${contact.mobileno ?? ''}`,
      `gn_web_users.telno=${contact.telno ?? ''}`,
      `gn_web_users.tmpid=${contact.tmpid ?? idempotencyKey}`,
      `gn_web_users.tozihat=${contact.tozihat ?? ''}`,
    ].join('|');

    const request: SiaghSaveFormRequest = {
      formId: this.CONTACT_FORM_ID,
      ctrlValues,
      parameters: 'CodeMain=',
      dataRows: '[]',
      attachments: '[]',
      postCode: '1110',
      flowId: '',
    };

    return this.request<SiaghSaveFormResponse>('POST', '/BpmsApi/SaveFormData', request);
  }

  /**
   * Update an existing contact
   * Note: Siagh may require different approach for updates
   */
  async updateContact(
    contactCode: string,
    contact: Partial<CreateSiaghContactRequest>,
    idempotencyKey: string,
  ): Promise<SiaghSaveFormResponse> {
    this.logger.log(`Updating Siagh contact: ${contactCode}`);

    // Build ctrlValues similar to create, but with CodeMain parameter
    const ctrlValues = Object.entries(contact)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `gn_web_users.${key}=${value}`)
      .join('|');

    const request: SiaghSaveFormRequest = {
      formId: this.CONTACT_FORM_ID,
      ctrlValues,
      parameters: `CodeMain=${contactCode}`,
      dataRows: '[]',
      attachments: '[]',
      postCode: '1110',
      flowId: '',
    };

    return this.request<SiaghSaveFormResponse>('POST', '/BpmsApi/SaveFormData', request);
  }

  // ==================== PreInvoice APIs ====================

  /**
   * Create a pre-invoice in Siagh
   * Endpoint: POST /BpmsApi/SaveFormData
   */
  async createPreInvoice(
    invoice: CreateSiaghPreInvoiceRequest,
    idempotencyKey: string,
  ): Promise<SiaghSaveFormResponse> {
    this.logger.log(`Creating Siagh pre-invoice for customer: ${invoice.codemoshtari}`);

    const fiscalYear = this.authService.getFiscalYear();

    // Build ctrlValues string
    const ctrlValues = [
      `sl_sanad.hssanadstate=8`,
      `sl_sanad.codenoeesanad=${invoice.codenoeesanad ?? '2'}`, // 2 = پیش فاکتور
      `sl_sanad.codesalemodel=${invoice.codesalemodel ?? '1'}`,
      `sl_sanad.salmali=${invoice.salmali ?? fiscalYear}`,
      `sl_sanad.codenoeepardakht=${invoice.codenoeepardakht ?? '2'}`,
      `sl_sanad.codemarkazforush=${invoice.codemarkazforush ?? ''}`,
      `sl_sanad.codecontact=${invoice.codecontact ?? ''}`,
      `sl_sanad.codemoshtari=${invoice.codemoshtari}`,
      `sl_sanad.codenoeeforush=${invoice.codenoeeforush ?? '1'}`,
      `sl_sanad.codevaseteh=${invoice.codevaseteh ?? ''}`,
      `sl_sanad.tozihat=${invoice.tozihat ?? ''}`,
      `sl_sanad.namenoesanad=${invoice.namenoesanad ?? 'پیش فاکتور فروش'}`,
    ].join('|');

    // Build dataRows with invoice items
    const dataRows = [
      {
        name: 'dbgrid1',
        entity: 'sl_rizsanad',
        keyField: 'coderiz',
        data: invoice.items.map((item, index) => ({
          __uid: { oldValue: `item${index}`, newValue: `item${index}` },
          _status: { oldValue: 'inserted', newValue: 'inserted' },
          codekala: { oldValue: null, newValue: item.codekala },
          nameunit: { oldValue: null, newValue: item.nameunit },
          qty: { oldValue: null, newValue: item.qty },
          mabtakhfif: { oldValue: null, newValue: item.mabtakhfif ?? 0 },
          vazn: { oldValue: null, newValue: item.vazn ?? '0' },
          hajm: { oldValue: null, newValue: item.hajm ?? '0' },
          price: { oldValue: null, newValue: item.price },
          radif: { oldValue: null, newValue: item.radif },
          finalqty: { oldValue: null, newValue: item.qty },
          takhfif: { oldValue: null, newValue: null },
          sumamelinc: { oldValue: null, newValue: null },
          sumameldec: { oldValue: null, newValue: null },
        })),
      },
    ];

    const request: SiaghSaveFormRequest = {
      formId: this.PREINVOICE_FORM_ID,
      ctrlValues,
      parameters: `_In_EditKeys=|_In_Suid=${idempotencyKey}|nocheck=`,
      dataRows: JSON.stringify(dataRows),
      attachments: '[]',
      postCode: '1110',
      flowId: '',
    };

    return this.request<SiaghSaveFormResponse>('POST', '/BpmsApi/SaveFormData', request);
  }

  /**
   * Helper: Check if response is successful
   */
  isSuccessResponse(response: SiaghSaveFormResponse): boolean {
    return response.ReturnValue === true && response.Errors.length === 0;
  }

  /**
   * Helper: Extract error messages from response
   */
  getErrorMessages(response: SiaghSaveFormResponse): string[] {
    return response.Errors.filter((e) => e.ErrorType !== 'ErrSuccs').map((e) => e.Description);
  }
}

