import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface SiaghLoginResponse {
  ContactCode: number;
  ContactName: string;
  UserCode: number;
  UserName: string;
  SessionId: string;
  Token: string;
  BranchCode: number;
  BranchName: string;
  IsAdminUser: boolean;
  FiscalYear: number;
  MobileNo: string;
  SystemDate: string;
  SystemTime: string;
}

@Injectable()
export class FinanceAuthService {
  private readonly logger = new Logger(FinanceAuthService.name);
  private sessionId: string | null = null;
  private token: string | null = null;
  private fiscalYear: number | null = null;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /**
   * Get SessionId for Siagh API authentication
   */
  async getSessionId(): Promise<string> {
    // Check if we have a valid session
    if (this.sessionId) {
      return this.sessionId;
    }

    // Session not available, authenticate
    await this.authenticate();
    if (!this.sessionId) {
      throw new Error('Failed to obtain Siagh session ID');
    }
    return this.sessionId;
  }

  /**
   * Get fiscal year from login
   */
  getFiscalYear(): number {
    return this.fiscalYear || new Date().getFullYear();
  }

  /**
   * Authenticate with Siagh Finance system using username/password
   * Endpoint: /GeneralApi/LoginUser
   */
  private async authenticate(): Promise<void> {
    try {
      const baseUrl = this.configService.get<string>('finance.baseUrl');
      const username = this.configService.get<string>('finance.username');
      const password = this.configService.get<string>('finance.password');

      if (!username || !password) {
        throw new Error('Siagh Finance API credentials not configured');
      }

      this.logger.log('Authenticating with Siagh Finance API...');

      // Siagh expects password to be MD5 hashed
      // Password should be pre-hashed in .env or hash it here
      const response = await firstValueFrom(
        this.httpService.post<SiaghLoginResponse>(`${baseUrl}/GeneralApi/LoginUser`, {
          UserName: username,
          Password: password, // Should be MD5 hashed
        }),
      );

      const { SessionId, Token, FiscalYear } = response.data;

      if (!SessionId || !Token) {
        throw new Error('No SessionId or Token received from Siagh API');
      }

      this.sessionId = SessionId;
      this.token = Token;
      this.fiscalYear = FiscalYear;

      this.logger.log('✅ Successfully authenticated with Siagh Finance API');
      this.logger.log(`   SessionId: ${SessionId.substring(0, 10)}...`);
      this.logger.log(`   Fiscal Year: ${FiscalYear}`);
    } catch (error) {
      this.logger.error('Siagh Finance authentication failed', error.message);
      throw new Error(`Siagh Finance authentication failed: ${error.message}`);
    }
  }

  /**
   * Get authorization headers for Siagh Finance API requests
   * Uses SessionId for authorization
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const sessionId = await this.getSessionId();
    return {
      Authorization: sessionId,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Clear stored session (useful for logout or error recovery)
   */
  clearToken(): void {
    this.sessionId = null;
    this.token = null;
    this.fiscalYear = null;
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    try {
      if (!this.sessionId) {
        return false;
      }

      // Try to make a simple API call to validate session
      const baseUrl = this.configService.get<string>('finance.baseUrl');
      const headers = await this.getAuthHeaders();

      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/Sgh/GEN/Gn_Web_Users/GetAll`, {
          headers,
          timeout: 5000,
        }),
      );

      this.logger.log('Siagh Finance session validated successfully');
      return response.status === 200;
    } catch (error) {
      this.logger.warn('Siagh Finance session validation failed', error.message);
      this.clearToken();
      return false;
    }
  }
}

