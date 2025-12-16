import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { SiaghUserDto, SiaghLoginResponse } from './dto/siagh-user.dto';

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
}
