"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CrmIdentityApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmIdentityApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const crm_auth_service_1 = require("./crm-auth.service");
let CrmIdentityApiClient = CrmIdentityApiClient_1 = class CrmIdentityApiClient {
    constructor(configService, httpService, authService) {
        this.configService = configService;
        this.httpService = httpService;
        this.authService = authService;
        this.logger = new common_1.Logger(CrmIdentityApiClient_1.name);
        this.baseUrl = this.configService.get('crm.baseUrl') || '';
    }
    async request(method, endpoint, data) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = await this.authService.getAuthHeaders();
            this.logger.debug(`${method} ${url}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.request({
                method,
                url,
                headers,
                data,
                timeout: 30000,
            }));
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            this.logger.error(`CRM API Error: ${method} ${endpoint}`, axiosError.response?.data || axiosError.message);
            if (axiosError.response?.status === 401) {
                this.logger.warn('CRM token expired, re-authenticating...');
                this.authService.clearToken();
                return this.request(method, endpoint, data);
            }
            throw new Error(`CRM API request failed: ${axiosError.message} - ${JSON.stringify(axiosError.response?.data)}`);
        }
    }
    async getIdentitiesSimple(pageNumber = 0, pageSize = 150, searchTerm, identityType) {
        const request = {
            pageNumber,
            pageSize,
            searchTerm: searchTerm || '',
            identityType,
        };
        return this.request('POST', '/api/v2/crmobject/identity/getIdentitiesSimple', request);
    }
    async getIdentities(pageNumber = 0, pageSize = 150, searchTerm, identityType) {
        const request = {
            pageNumber,
            pageSize,
            searchTerm: searchTerm || '',
            identityType,
        };
        return this.request('POST', '/api/v2/crmobject/identity/getIdentities', request);
    }
    async getCustomers(pageNumber = 0, pageSize = 150, searchTerm) {
        const request = {
            pageNumber,
            pageSize,
            searchTerm: searchTerm || '',
        };
        return this.request('POST', '/api/v2/crmobject/identity/getCustomers', request);
    }
    async searchIdentities(pageNumber = 0, pageSize = 150, searchTerm, identityType) {
        const request = {
            pageNumber,
            pageSize,
            searchTerm: searchTerm || '',
            identityType,
        };
        return this.request('POST', '/api/v2/crmobject/identity/search', request);
    }
    async getPerson(personId) {
        return this.request('POST', '/api/v2/crmobject/person/get', {
            id: personId,
        });
    }
    async findPersons(criteria) {
        return this.request('POST', '/api/v2/crmobject/person/find', criteria);
    }
    async createPerson(person) {
        this.logger.log(`Creating person: ${person.nickName}`);
        return this.request('POST', '/api/v2/crmobject/person/create', person);
    }
    async updatePerson(personId, person) {
        this.logger.log(`Updating person: ${personId}`);
        return this.request('POST', '/api/v2/crmobject/person/update', {
            id: personId,
            ...person,
        });
    }
    async deletePerson(personId) {
        return this.request('POST', '/api/v2/crmobject/person/delete', { id: personId });
    }
    async getOrganization(orgId) {
        return this.request('POST', '/api/v2/crmobject/organization/get', {
            id: orgId,
        });
    }
    async findOrganizations(criteria) {
        return this.request('POST', '/api/v2/crmobject/organization/find', criteria);
    }
    async createOrganization(org) {
        this.logger.log(`Creating organization: ${org.nickName}`);
        return this.request('POST', '/api/v2/crmobject/organization/create', org);
    }
    async updateOrganization(orgId, org) {
        this.logger.log(`Updating organization: ${orgId}`);
        return this.request('POST', '/api/v2/crmobject/organization/update', {
            id: orgId,
            ...org,
        });
    }
    async deleteOrganization(orgId) {
        return this.request('POST', '/api/v2/crmobject/organization/delete', { id: orgId });
    }
};
exports.CrmIdentityApiClient = CrmIdentityApiClient;
exports.CrmIdentityApiClient = CrmIdentityApiClient = CrmIdentityApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        crm_auth_service_1.CrmAuthService])
], CrmIdentityApiClient);
//# sourceMappingURL=crm-identity-api.client.js.map