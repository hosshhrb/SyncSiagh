import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { SiaghUserDto, SiaghLoginResponse } from './dto/siagh-user.dto';
import { CreateSiaghContactRequest } from './dto/siagh-contact.dto';
import { SiaghSaveFormResponse } from './dto/siagh-save-response.dto';
import { CreateSiaghPreInvoiceRequest } from './dto/siagh-preinvoice.dto';

/**
 * Siagh Finance API Client
 * Direct implementation based on actual API documentation
 */
@Injectable()
export class SiaghApiClient {
  private readonly logger = new Logger(SiaghApiClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private sessionId: string | null = null;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('finance.apiBaseUrl') || 'http://172.16.16.15';
    this.username = this.configService.get<string>('finance.username') || 'مدیر سیستم';
    this.password = this.configService.get<string>('finance.password') || '92C0ED8C3EC1DD67D834D3005A592A80';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use((config) => {
      this.logger.debug(`📤 Siagh Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`📥 Siagh Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(`❌ Siagh Error: ${error.message}`);
        throw error;
      },
    );
  }

  /**
   * Login to Siagh and get session token
   */
  async login(): Promise<SiaghLoginResponse> {
    this.logger.log('🔐 Logging in to Siagh Finance...');
    
    const response = await this.client.post<SiaghLoginResponse>('/GeneralApi/LoginUser', {
      UserName: this.username,
      Password: this.password,
    });

    this.sessionId = response.data.SessionId || response.data.Token;
    
    this.logger.log(`✅ Siagh login successful. Session: ${this.sessionId?.substring(0, 8)}...`);
    this.logger.log(`   User: ${response.data.UserName}`);
    this.logger.log(`   Branch: ${response.data.BranchName}`);
    this.logger.log(`   Fiscal Year: ${response.data.FiscalYear}`);
    
    return response.data;
  }

  /**
   * Ensure we have a valid session
   */
  private async ensureSession(): Promise<string> {
    if (!this.sessionId) {
      await this.login();
    }
    return this.sessionId!;
  }

  /**
   * Get all users/contacts from Siagh
   * Endpoint: GET /api/Sgh/GEN/Gn_Web_Users/GetAll
   */
  async getAllUsers(): Promise<SiaghUserDto[]> {
    const sessionId = await this.ensureSession();
    
    this.logger.log('📥 Fetching all users from Siagh...');
    
    const response = await this.client.get<SiaghUserDto[]>('/api/Sgh/GEN/Gn_Web_Users/GetAll', {
      headers: {
        'Authorization': sessionId,
      },
    });

    this.logger.log(`✅ Retrieved ${response.data.length} users from Siagh`);
    
    return response.data;
  }

  /**
   * Get users with filter
   */
  async getUsersFiltered(filter: Record<string, any>): Promise<SiaghUserDto[]> {
    const sessionId = await this.ensureSession();
    
    this.logger.log(`📥 Fetching filtered users from Siagh...`);
    this.logger.debug(`   Filter: ${JSON.stringify(filter)}`);
    
    const response = await this.client.post<SiaghUserDto[]>('/api/Sgh/GEN/Gn_Web_Users/GetAll', filter, {
      headers: {
        'Authorization': sessionId,
      },
    });

    this.logger.log(`✅ Retrieved ${response.data.length} filtered users from Siagh`);
    
    return response.data;
  }

  /**
   * Get session ID for external use
   */
  async getSessionId(): Promise<string> {
    return this.ensureSession();
  }

  /**
   * Get all contacts (alias for getAllUsers)
   */
  async getAllContacts(): Promise<SiaghUserDto[]> {
    return this.getAllUsers();
  }

  /**
   * Check if connected
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.login();
      return true;
    } catch (error) {
      this.logger.error(`❌ Siagh connection failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Find contact by TpmId (unique identifier)
   */
  async findContactByTpmId(tpmId: string): Promise<SiaghUserDto | null> {
    const allUsers = await this.getAllUsers();
    return allUsers.find(u => u.TpmId === tpmId) || null;
  }

  /**
   * Find contact by RecordId (legacy - kept for compatibility)
   * @deprecated Use findContactByTpmId instead
   */
  async findContactByRecordId(recordId: string): Promise<SiaghUserDto | null> {
    const allUsers = await this.getAllUsers();
    return allUsers.find(u => u.RecordId === recordId) || null;
  }

  /**
   * Find contact by customer number (Code)
   */
  async findContactByCustomerNumber(customerNumber: string): Promise<SiaghUserDto | null> {
    const code = parseInt(customerNumber, 10);
    if (isNaN(code)) {
      return null;
    }
    const allUsers = await this.getAllUsers();
    return allUsers.find(u => u.Code === code) || null;
  }

  /**
   * Create a new contact in Siagh
   * POST /BpmsApi/SaveFormData (formId: "2BFDA")
   */
  async createContact(data: CreateSiaghContactRequest): Promise<string> {
    const sessionId = await this.ensureSession();
    
    this.logger.log(`➕ Creating contact in Siagh: ${data.fullname}`);
    
    // Build ctrlValues string (pipe-separated key=value pairs)
    const ctrlValues = [
      'NickName=dbgrid1.#nickname#',
      `gn_web_users.isactive=${data.isactive ?? 1}`,
      `gn_web_users.gender=${data.gender ?? ''}`,
      `gn_web_users.websiteaddress=${data.websiteaddress ?? ''}`,
      `gn_web_users.pocode=${data.pocode ?? ''}`,
      `gn_web_users.codeostan=${data.codeostan ?? ''}`,
      `gn_web_users.address=${data.address ?? ''}`,
      `gn_web_users.codeshahr=${data.codeshahr ?? ''}`,
      `gn_web_users.countrycode=${data.countrycode ?? ''}`,
      `gn_web_users.email=${data.email ?? ''}`,
      `gn_web_users.fullname=${data.fullname}`,
      `gn_web_users.mobileno=${data.mobileno ?? ''}`,
      `gn_web_users.telno=${data.telno ?? ''}`,
      `gn_web_users.tpmid=${data.tpmid ?? ''}`,
      `gn_web_users.tozihat=${data.tozihat ?? ''}`,
      `gn_web_users.taraftype=${data.taraftype ?? 0}`,
    ].join('|');

    const requestBody = {
      formId: '2BFDA',
      ctrlValues,
      parameters: 'CodeMain=',
      dataRows: '[]',
      attachments: '[]',
      postCode: '1110',
      flowId: '',
    };

    this.logger.debug(`   Request: ${JSON.stringify(requestBody, null, 2)}`);

    const response = await this.client.post<SiaghSaveFormResponse>(
      '/BpmsApi/SaveFormData',
      requestBody,
      {
        headers: {
          'Authorization': sessionId,
        },
      },
    );

    // Check for errors
    const errors = response.data.Errors?.filter(e => e.ErrorType === 'ErrError') || [];
    if (errors.length > 0) {
      const errorMsg = errors.map(e => e.Description).join('; ');
      this.logger.error(`❌ Failed to create contact: ${errorMsg}`);
      throw new Error(`Siagh API error: ${errorMsg}`);
    }

    const contactCode = response.data.ReturnCode;
    this.logger.log(`✅ Contact created with code: ${contactCode}`);
    
    return contactCode;
  }

  /**
   * Update an existing contact in Siagh
   * POST /BpmsApi/SaveFormData (formId: "2BFDA", with CodeMain parameter)
   */
  async updateContact(code: string, data: CreateSiaghContactRequest): Promise<string> {
    const sessionId = await this.ensureSession();
    
    this.logger.log(`🔄 Updating contact in Siagh: ${data.fullname} (Code: ${code})`);
    
    // Build ctrlValues string
    const ctrlValues = [
      'NickName=dbgrid1.#nickname#',
      `gn_web_users.isactive=${data.isactive ?? 1}`,
      `gn_web_users.gender=${data.gender ?? ''}`,
      `gn_web_users.websiteaddress=${data.websiteaddress ?? ''}`,
      `gn_web_users.pocode=${data.pocode ?? ''}`,
      `gn_web_users.codeostan=${data.codeostan ?? ''}`,
      `gn_web_users.address=${data.address ?? ''}`,
      `gn_web_users.codeshahr=${data.codeshahr ?? ''}`,
      `gn_web_users.countrycode=${data.countrycode ?? ''}`,
      `gn_web_users.email=${data.email ?? ''}`,
      `gn_web_users.fullname=${data.fullname}`,
      `gn_web_users.mobileno=${data.mobileno ?? ''}`,
      `gn_web_users.telno=${data.telno ?? ''}`,
      `gn_web_users.tpmid=${data.tpmid ?? ''}`,
      `gn_web_users.tozihat=${data.tozihat ?? ''}`,
      `gn_web_users.taraftype=${data.taraftype ?? 0}`,
    ].join('|');

    const requestBody = {
      formId: '2BFDA',
      ctrlValues,
      parameters: `CodeMain=${code}`,  // This identifies the existing contact
      dataRows: '[]',
      attachments: '[]',
      postCode: '1110',
      flowId: '',
    };

    const response = await this.client.post<SiaghSaveFormResponse>(
      '/BpmsApi/SaveFormData',
      requestBody,
      {
        headers: {
          'Authorization': sessionId,
        },
      },
    );

    // Check for errors
    const errors = response.data.Errors?.filter(e => e.ErrorType === 'ErrError') || [];
    if (errors.length > 0) {
      const errorMsg = errors.map(e => e.Description).join('; ');
      this.logger.error(`❌ Failed to update contact: ${errorMsg}`);
      throw new Error(`Siagh API error: ${errorMsg}`);
    }

    this.logger.log(`✅ Contact updated successfully`);
    return response.data.ReturnCode || code;
  }

  /**
   * Create a pre-invoice in Siagh
   * POST /BpmsApi/SaveFormData (formId: "43D81")
   */
  async createPreInvoice(data: CreateSiaghPreInvoiceRequest): Promise<string> {
    const sessionId = await this.ensureSession();
    
    this.logger.log(`➕ Creating pre-invoice in Siagh for customer: ${data.codemoshtari}`);
    
    // Build ctrlValues string
    const ctrlValues = [
      'sl_sanad.hssanadstate=8',
      `sl_sanad.codenoeesanad=${data.codenoeesanad ?? '2'}`,
      `sl_sanad.codesalemodel=${data.codesalemodel ?? '1'}`,
      `sl_sanad.salmali=${data.salmali ?? 1404}`,
      `sl_sanad.codenoeepardakht=${data.codenoeepardakht ?? '2'}`,
      `sl_sanad.codemarkazforush=${data.codemarkazforush ?? ''}`,
      `sl_sanad.codecontact=${data.codecontact ?? ''}`,
      `sl_sanad.codemoshtari=${data.codemoshtari}`,
      `sl_sanad.codenoeeforush=${data.codenoeeforush ?? '1'}`,
      `sl_sanad.codevaseteh=${data.codevaseteh ?? ''}`,
      `sl_sanad.tozihat=${data.tozihat ?? ''}`,
      `sl_sanad.namenoesanad=${data.namenoesanad ?? 'پیش فاکتور فروش بنیان گاز'}`,
    ].join('|');

    // Build dataRows JSON string for line items
    const dataRows = JSON.stringify([{
      name: 'dbgrid1',
      entity: 'sl_rizsanad',
      keyField: 'coderiz',
      data: data.items.map((item, index) => ({
        __uid: {
          oldValue: `item-${index}`,
          newValue: `item-${index}`,
        },
        _status: {
          oldValue: 'inserted',
          newValue: 'inserted',
        },
        codekala: {
          oldValue: null,
          newValue: item.codekala,
        },
        nameunit: {
          oldValue: null,
          newValue: item.nameunit,
        },
        qty: {
          oldValue: null,
          newValue: item.qty,
        },
        mabtakhfif: {
          oldValue: null,
          newValue: item.mabtakhfif ?? 0,
        },
        vazn: {
          oldValue: null,
          newValue: item.vazn ?? '0',
        },
        hajm: {
          oldValue: null,
          newValue: item.hajm ?? '0',
        },
        price: {
          oldValue: null,
          newValue: item.price,
        },
        radif: {
          oldValue: null,
          newValue: item.radif ?? String(index + 1),
        },
        finalqty: {
          oldValue: null,
          newValue: item.qty,
        },
        takhfif: {
          oldValue: null,
          newValue: null,
        },
        sumamelinc: {
          oldValue: null,
          newValue: null,
        },
        sumameldec: {
          oldValue: null,
          newValue: null,
        },
      })),
    }]);

    const requestBody = {
      formId: '43D81',
      ctrlValues,
      parameters: '_In_EditKeys=|_In_Suid=' + this.generateUUID() + '|nocheck=',
      dataRows,
      attachments: '[]',
      postCode: '1110',
      flowId: '',
    };

    this.logger.debug(`   Request: ${JSON.stringify(requestBody, null, 2)}`);

    const response = await this.client.post<SiaghSaveFormResponse>(
      '/BpmsApi/SaveFormData',
      requestBody,
      {
        headers: {
          'Authorization': sessionId,
        },
      },
    );

    // Check for errors
    const errors = response.data.Errors?.filter(e => e.ErrorType === 'ErrError') || [];
    if (errors.length > 0) {
      const errorMsg = errors.map(e => e.Description).join('; ');
      this.logger.error(`❌ Failed to create pre-invoice: ${errorMsg}`);
      throw new Error(`Siagh API error: ${errorMsg}`);
    }

    // Extract invoice number from success message
    const successMsg = response.data.FinalMessages?.[0] || '';
    const invoiceMatch = successMsg.match(/شماره\s+(\d+)/);
    const invoiceNumber = invoiceMatch ? invoiceMatch[1] : response.data.ReturnCode;
    
    this.logger.log(`✅ Pre-invoice created with number: ${invoiceNumber}`);
    
    return invoiceNumber;
  }

  /**
   * Generate UUID for Siagh requests
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }).toUpperCase();
  }
}
