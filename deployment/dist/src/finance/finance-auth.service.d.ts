import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
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
export declare class FinanceAuthService {
    private configService;
    private httpService;
    private readonly logger;
    private sessionId;
    private token;
    private fiscalYear;
    private sessionData;
    constructor(configService: ConfigService, httpService: HttpService);
    getSessionId(): Promise<string>;
    getFiscalYear(): number;
    private authenticate;
    getAuthHeaders(): Promise<Record<string, string>>;
    getSessionData(): SiaghLoginResponse | null;
    clearToken(): void;
    validateSession(): Promise<boolean>;
    ensureAuthenticated(): Promise<void>;
}
export {};
