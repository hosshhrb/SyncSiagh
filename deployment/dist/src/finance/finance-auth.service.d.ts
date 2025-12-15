import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare class FinanceAuthService {
    private configService;
    private httpService;
    private readonly logger;
    private sessionId;
    private token;
    private fiscalYear;
    constructor(configService: ConfigService, httpService: HttpService);
    getSessionId(): Promise<string>;
    getFiscalYear(): number;
    private authenticate;
    getAuthHeaders(): Promise<Record<string, string>>;
    clearToken(): void;
    validateSession(): Promise<boolean>;
}
