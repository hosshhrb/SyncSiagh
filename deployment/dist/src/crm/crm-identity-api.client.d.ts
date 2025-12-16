import { ConfigService } from '@nestjs/config';
import { CrmAuthService } from './crm-auth.service';
import { CrmIdentitySearchResult, CrmIdentitySearchRequest, CrmCreatePersonRequest, CrmCreateOrganizationRequest, CrmCreateIdentityResponse } from './dto/crm-identity.dto';
export declare class CrmIdentityApiClient {
    private configService;
    private authService;
    private readonly logger;
    private readonly client;
    private readonly baseUrl;
    constructor(configService: ConfigService, authService: CrmAuthService);
    searchAllIdentities(): Promise<CrmIdentitySearchResult[]>;
    searchIdentities(request: CrmIdentitySearchRequest): Promise<CrmIdentitySearchResult[]>;
    createPerson(data: CrmCreatePersonRequest): Promise<CrmCreateIdentityResponse>;
    createOrganization(data: CrmCreateOrganizationRequest): Promise<CrmCreateIdentityResponse>;
    getPerson(identityId: string): Promise<any>;
    getOrganization(identityId: string): Promise<any>;
    checkConnection(): Promise<boolean>;
}
