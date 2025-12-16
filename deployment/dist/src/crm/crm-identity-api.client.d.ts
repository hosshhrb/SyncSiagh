import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CrmAuthService } from './crm-auth.service';
import { CrmIdentitySimpleDto } from './dto/crm-identity.dto';
import { CrmPersonDto, CrmOrganizationDto } from './dto/crm-customer.dto';
export declare class CrmIdentityApiClient {
    private configService;
    private httpService;
    private authService;
    private readonly logger;
    private readonly baseUrl;
    constructor(configService: ConfigService, httpService: HttpService, authService: CrmAuthService);
    private request;
    getIdentitiesSimple(pageNumber?: number, pageSize?: number, searchTerm?: string, identityType?: number): Promise<CrmIdentitySimpleDto[]>;
    getIdentities(pageNumber?: number, pageSize?: number, searchTerm?: string, identityType?: number): Promise<CrmIdentitySimpleDto[]>;
    getCustomers(pageNumber?: number, pageSize?: number, searchTerm?: string): Promise<CrmIdentitySimpleDto[]>;
    searchIdentities(pageNumber?: number, pageSize?: number, searchTerm?: string, identityType?: number): Promise<CrmIdentitySimpleDto[]>;
    getPerson(personId: string): Promise<CrmPersonDto>;
    findPersons(criteria: any): Promise<CrmPersonDto[]>;
    createPerson(person: CrmPersonDto): Promise<{
        id: string;
    }>;
    updatePerson(personId: string, person: Partial<CrmPersonDto>): Promise<void>;
    deletePerson(personId: string): Promise<void>;
    getOrganization(orgId: string): Promise<CrmOrganizationDto>;
    findOrganizations(criteria: any): Promise<CrmOrganizationDto[]>;
    createOrganization(org: CrmOrganizationDto): Promise<{
        id: string;
    }>;
    updateOrganization(orgId: string, org: Partial<CrmOrganizationDto>): Promise<void>;
    deleteOrganization(orgId: string): Promise<void>;
}
