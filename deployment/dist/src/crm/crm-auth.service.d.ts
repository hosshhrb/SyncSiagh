import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare class CrmAuthService {
    private configService;
    private httpService;
    private readonly logger;
    private accessToken;
    private refreshToken;
    private expiresAt;
    constructor(configService: ConfigService, httpService: HttpService);
    getToken(): Promise<string>;
    private authenticate;
    getAuthHeaders(): Promise<Record<string, string>>;
    clearToken(): void;
    validateToken(): Promise<boolean>;
}
