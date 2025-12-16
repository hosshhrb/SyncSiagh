import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface PayamgostarLoginRequest {
  username: string;
  password: string;
  deviceId?: string;
  platformType?: number;
  os?: string;
  osVersion?: string;
  token?: string;
}

interface PayamgostarLoginResponse {
  expiresAt: string;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class CrmAuthService {
  private readonly logger = new Logger(CrmAuthService.name);
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: Date | null = null;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /**
   * Get authentication token for CRM API
   * Automatically refreshes if expired
   */
  async getToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.expiresAt && new Date() < this.expiresAt) {
      return this.accessToken;
    }

    // Token expired or not available, authenticate
    await this.authenticate();
    if (!this.accessToken) {
      throw new Error('Failed to obtain CRM access token');
    }
    return this.accessToken;
  }

  /**
   * Authenticate with Payamgostar CRM
   * Endpoint: POST /api/v2/auth/login
   * Base URL: http://172.16.16.16
   */
  private async authenticate(): Promise<void> {
    try {
      const baseUrl = this.configService.get<string>('crm.baseUrl');
      const username = this.configService.get<string>('crm.username');
      const password = this.configService.get<string>('crm.password');

      if (!username || !password) {
        throw new Error('CRM API credentials not configured');
      }

      this.logger.log('Authenticating with Payamgostar CRM...');
      this.logger.log(`   URL: ${baseUrl}/api/v2/auth/login`);
      this.logger.log(`   Username: ${username}`);

      const loginData: PayamgostarLoginRequest = {
        username,
        password,
        deviceId: 'SiaghSync-Server',
        platformType: 1,
        os: 'Linux',
        osVersion: '1.0',
        token: '',
      };

      const response = await firstValueFrom(
        this.httpService.post<PayamgostarLoginResponse>(
          `${baseUrl}/api/v2/auth/login`,
          loginData,
          {
            timeout: 30000,
          },
        ),
      );

      const { accessToken, refreshToken, expiresAt } = response.data;

      if (!accessToken) {
        throw new Error('No access token received from CRM');
      }

      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.expiresAt = new Date(expiresAt);

      this.logger.log('✅ Successfully authenticated with Payamgostar CRM');
      this.logger.log(`   Token expires at: ${expiresAt}`);
    } catch (error) {
      this.logger.error('CRM authentication failed', error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid CRM credentials');
      } else if (error.response?.status === 403) {
        throw new Error('Too many login attempts! Try again later.');
      } else if (error.response?.status === 402) {
        throw new Error('MobileApp module not available in CRM');
      }
      
      throw new Error(`CRM authentication failed: ${error.message}`);
    }
  }

  /**
   * Get authorization headers for CRM API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Clear stored tokens
   */
  clearToken(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  /**
   * Validate token by making a test API call
   */
  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getToken();
      this.logger.log('CRM token validated successfully');
      return !!token;
    } catch (error) {
      this.logger.warn('CRM token validation failed', error.message);
      this.clearToken();
      return false;
    }
  }
}

