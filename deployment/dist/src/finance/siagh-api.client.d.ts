import { ConfigService } from '@nestjs/config';
import { SiaghUserDto, SiaghLoginResponse } from './dto/siagh-user.dto';
export declare class SiaghApiClient {
    private configService;
    private readonly logger;
    private readonly client;
    private readonly baseUrl;
    private readonly username;
    private readonly password;
    private sessionId;
    constructor(configService: ConfigService);
    login(): Promise<SiaghLoginResponse>;
    private ensureSession;
    getAllUsers(): Promise<SiaghUserDto[]>;
    getUsersFiltered(filter: Record<string, any>): Promise<SiaghUserDto[]>;
    getSessionId(): Promise<string>;
    getAllContacts(): Promise<SiaghUserDto[]>;
    checkConnection(): Promise<boolean>;
}
