import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { CrmAuthService } from './crm-auth.service';
import {
  CrmIdentitySimpleDto,
  CrmIdentitySearchRequest,
} from './dto/crm-identity.dto';
import { CrmPersonDto, CrmOrganizationDto } from './dto/crm-customer.dto';

/**
 * CRM Identity API Client
 * Handles Person and Organization endpoints
 * Base URL: http://172.16.16.16
 */
@Injectable()
export class CrmIdentityApiClient {
  private readonly logger = new Logger(CrmIdentityApiClient.name);
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: CrmAuthService,
  ) {
    this.baseUrl = this.configService.get<string>('crm.baseUrl') || '';
  }

  /**
   * Generic request method
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
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
        `CRM API Error: ${method} ${endpoint}`,
        axiosError.response?.data || axiosError.message,
      );

      // Auto re-auth on 401
      if (axiosError.response?.status === 401) {
        this.logger.warn('CRM token expired, re-authenticating...');
        this.authService.clearToken();
        // Retry once
        return this.request<T>(method, endpoint, data);
      }

      throw new Error(
        `CRM API request failed: ${axiosError.message} - ${JSON.stringify(axiosError.response?.data)}`,
      );
    }
  }

  // ==================== Identity APIs ====================

  /**
   * Get all identities (both Person and Organization)
   * POST /api/v2/crmobject/identity/getIdentitiesSimple
   */
  async getIdentitiesSimple(
    pageNumber = 0,
    pageSize = 150,
    searchTerm?: string,
    identityType?: number,
  ): Promise<CrmIdentitySimpleDto[]> {
    const request: CrmIdentitySearchRequest = {
      pageNumber,
      pageSize,
      searchTerm: searchTerm || '',
      identityType,
    };

    return this.request<CrmIdentitySimpleDto[]>(
      'POST',
      '/api/v2/crmobject/identity/getIdentitiesSimple',
      request,
    );
  }

  /**
   * Get all identities (full data)
   * POST /api/v2/crmobject/identity/getIdentities
   */
  async getIdentities(
    pageNumber = 0,
    pageSize = 150,
    searchTerm?: string,
    identityType?: number,
  ): Promise<CrmIdentitySimpleDto[]> {
    const request: CrmIdentitySearchRequest = {
      pageNumber,
      pageSize,
      searchTerm: searchTerm || '',
      identityType,
    };

    return this.request<CrmIdentitySimpleDto[]>(
      'POST',
      '/api/v2/crmobject/identity/getIdentities',
      request,
    );
  }

  /**
   * Get customers only
   * POST /api/v2/crmobject/identity/getCustomers
   */
  async getCustomers(
    pageNumber = 0,
    pageSize = 150,
    searchTerm?: string,
  ): Promise<CrmIdentitySimpleDto[]> {
    const request: CrmIdentitySearchRequest = {
      pageNumber,
      pageSize,
      searchTerm: searchTerm || '',
    };

    return this.request<CrmIdentitySimpleDto[]>(
      'POST',
      '/api/v2/crmobject/identity/getCustomers',
      request,
    );
  }

  /**
   * Search identities
   * POST /api/v2/crmobject/identity/search
   */
  async searchIdentities(
    pageNumber = 0,
    pageSize = 150,
    searchTerm?: string,
    identityType?: number,
  ): Promise<CrmIdentitySimpleDto[]> {
    const request: CrmIdentitySearchRequest = {
      pageNumber,
      pageSize,
      searchTerm: searchTerm || '',
      identityType,
    };

    return this.request<CrmIdentitySimpleDto[]>(
      'POST',
      '/api/v2/crmobject/identity/search',
      request,
    );
  }

  // ==================== Person APIs ====================

  /**
   * Get person by ID
   * POST /api/v2/crmobject/person/get
   */
  async getPerson(personId: string): Promise<CrmPersonDto> {
    return this.request<CrmPersonDto>('POST', '/api/v2/crmobject/person/get', {
      id: personId,
    });
  }

  /**
   * Find persons
   * POST /api/v2/crmobject/person/find
   */
  async findPersons(criteria: any): Promise<CrmPersonDto[]> {
    return this.request<CrmPersonDto[]>('POST', '/api/v2/crmobject/person/find', criteria);
  }

  /**
   * Create person
   * POST /api/v2/crmobject/person/create
   */
  async createPerson(person: CrmPersonDto): Promise<{ id: string }> {
    this.logger.log(`Creating person: ${person.nickName}`);
    return this.request<{ id: string }>('POST', '/api/v2/crmobject/person/create', person);
  }

  /**
   * Update person
   * POST /api/v2/crmobject/person/update
   */
  async updatePerson(personId: string, person: Partial<CrmPersonDto>): Promise<void> {
    this.logger.log(`Updating person: ${personId}`);
    return this.request<void>('POST', '/api/v2/crmobject/person/update', {
      id: personId,
      ...person,
    });
  }

  /**
   * Delete person
   * POST /api/v2/crmobject/person/delete
   */
  async deletePerson(personId: string): Promise<void> {
    return this.request<void>('POST', '/api/v2/crmobject/person/delete', { id: personId });
  }

  // ==================== Organization APIs ====================

  /**
   * Get organization by ID
   * POST /api/v2/crmobject/organization/get
   */
  async getOrganization(orgId: string): Promise<CrmOrganizationDto> {
    return this.request<CrmOrganizationDto>('POST', '/api/v2/crmobject/organization/get', {
      id: orgId,
    });
  }

  /**
   * Find organizations
   * POST /api/v2/crmobject/organization/find
   */
  async findOrganizations(criteria: any): Promise<CrmOrganizationDto[]> {
    return this.request<CrmOrganizationDto[]>(
      'POST',
      '/api/v2/crmobject/organization/find',
      criteria,
    );
  }

  /**
   * Create organization
   * POST /api/v2/crmobject/organization/create
   */
  async createOrganization(org: CrmOrganizationDto): Promise<{ id: string }> {
    this.logger.log(`Creating organization: ${org.nickName}`);
    return this.request<{ id: string }>(
      'POST',
      '/api/v2/crmobject/organization/create',
      org,
    );
  }

  /**
   * Update organization
   * POST /api/v2/crmobject/organization/update
   */
  async updateOrganization(orgId: string, org: Partial<CrmOrganizationDto>): Promise<void> {
    this.logger.log(`Updating organization: ${orgId}`);
    return this.request<void>('POST', '/api/v2/crmobject/organization/update', {
      id: orgId,
      ...org,
    });
  }

  /**
   * Delete organization
   * POST /api/v2/crmobject/organization/delete
   */
  async deleteOrganization(orgId: string): Promise<void> {
    return this.request<void>('POST', '/api/v2/crmobject/organization/delete', { id: orgId });
  }
}

