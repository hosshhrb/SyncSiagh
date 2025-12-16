import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CrmAuthService } from './crm-auth.service';
import {
  CrmIdentitySearchResult,
  CrmIdentitySearchRequest,
  CrmCreatePersonRequest,
  CrmCreateOrganizationRequest,
  CrmCreateIdentityResponse,
} from './dto/crm-identity.dto';

/**
 * CRM Identity API Client
 * Handles all identity-related operations in Payamgostar CRM
 */
@Injectable()
export class CrmIdentityApiClient {
  private readonly logger = new Logger(CrmIdentityApiClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private authService: CrmAuthService,
  ) {
    this.baseUrl = this.configService.get<string>('crm.apiBaseUrl') || 'http://172.16.16.16';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth and logging
    this.client.interceptors.request.use(async (config) => {
      const token = await this.authService.getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      this.logger.debug(`📤 CRM Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`📥 CRM Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(`❌ CRM Error: ${error.response?.status} ${error.message}`);
        if (error.response?.data) {
          this.logger.error(`   Response: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
      },
    );
  }

  /**
   * Search all identities in CRM
   * POST /api/v2/crmobject/identity/search
   * Pass empty body {} to get all records
   */
  async searchAllIdentities(): Promise<CrmIdentitySearchResult[]> {
    this.logger.log('📥 Fetching all identities from CRM...');
    
    const allIdentities: CrmIdentitySearchResult[] = [];
    let pageNumber = 0;
    const pageSize = 500; // Fetch in batches for efficiency
    let hasMore = true;

    while (hasMore) {
      const response = await this.client.post<CrmIdentitySearchResult[]>(
        '/api/v2/crmobject/identity/search',
        {
          pageNumber,
          pageSize,
        },
      );

      if (response.data && response.data.length > 0) {
        allIdentities.push(...response.data);
        this.logger.debug(`   Page ${pageNumber}: ${response.data.length} identities`);
        
        if (response.data.length < pageSize) {
          hasMore = false;
        } else {
          pageNumber++;
        }
      } else {
        hasMore = false;
      }
    }

    this.logger.log(`✅ Retrieved ${allIdentities.length} identities from CRM`);
    return allIdentities;
  }

  /**
   * Search identities with specific criteria
   */
  async searchIdentities(request: CrmIdentitySearchRequest): Promise<CrmIdentitySearchResult[]> {
    const response = await this.client.post<CrmIdentitySearchResult[]>(
      '/api/v2/crmobject/identity/search',
      request,
    );
    return response.data;
  }

  /**
   * Create a Person identity in CRM
   * POST /api/v2/crmobject/person/create
   */
  async createPerson(data: CrmCreatePersonRequest): Promise<CrmCreateIdentityResponse> {
    this.logger.log(`➕ Creating person in CRM: ${data.nickName}`);
    this.logger.debug(`   Data: ${JSON.stringify(data, null, 2)}`);
    
    const response = await this.client.post<CrmCreateIdentityResponse>(
      '/api/v2/crmobject/person/create',
      data,
    );

    this.logger.log(`✅ Person created: ${response.data.id}`);
    return response.data;
  }

  /**
   * Create an Organization identity in CRM
   * POST /api/v2/crmobject/organization/create
   */
  async createOrganization(data: CrmCreateOrganizationRequest): Promise<CrmCreateIdentityResponse> {
    this.logger.log(`➕ Creating organization in CRM: ${data.nickName}`);
    this.logger.debug(`   Data: ${JSON.stringify(data, null, 2)}`);
    
    const response = await this.client.post<CrmCreateIdentityResponse>(
      '/api/v2/crmobject/organization/create',
      data,
    );

    this.logger.log(`✅ Organization created: ${response.data.id}`);
    return response.data;
  }

  /**
   * Get person by ID
   */
  async getPerson(identityId: string): Promise<any> {
    const response = await this.client.post('/api/v2/crmobject/person/get', {
      identityId,
    });
    return response.data;
  }

  /**
   * Get organization by ID
   */
  async getOrganization(identityId: string): Promise<any> {
    const response = await this.client.post('/api/v2/crmobject/organization/get', {
      identityId,
    });
    return response.data;
  }

  /**
   * Check if CRM is reachable
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.authService.getToken();
      return true;
    } catch (error) {
      this.logger.error(`❌ CRM connection failed: ${error.message}`);
      return false;
    }
  }
}
