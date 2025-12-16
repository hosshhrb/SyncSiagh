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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CrmIdentityApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmIdentityApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const crm_auth_service_1 = require("./crm-auth.service");
let CrmIdentityApiClient = CrmIdentityApiClient_1 = class CrmIdentityApiClient {
    constructor(configService, authService) {
        this.configService = configService;
        this.authService = authService;
        this.logger = new common_1.Logger(CrmIdentityApiClient_1.name);
        this.baseUrl = this.configService.get('crm.apiBaseUrl') || 'http://172.16.16.16';
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.client.interceptors.request.use(async (config) => {
            const token = await this.authService.getToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            this.logger.debug(`📤 CRM Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        });
        this.client.interceptors.response.use((response) => {
            this.logger.debug(`📥 CRM Response: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            this.logger.error(`❌ CRM Error: ${error.response?.status} ${error.message}`);
            if (error.response?.data) {
                this.logger.error(`   Response: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        });
    }
    async searchAllIdentities() {
        this.logger.log('📥 Fetching all identities from CRM...');
        const allIdentities = [];
        let pageNumber = 0;
        const pageSize = 500;
        let hasMore = true;
        while (hasMore) {
            const response = await this.client.post('/api/v2/crmobject/identity/search', {
                pageNumber,
                pageSize,
            });
            if (response.data && response.data.length > 0) {
                allIdentities.push(...response.data);
                this.logger.debug(`   Page ${pageNumber}: ${response.data.length} identities`);
                if (response.data.length < pageSize) {
                    hasMore = false;
                }
                else {
                    pageNumber++;
                }
            }
            else {
                hasMore = false;
            }
        }
        this.logger.log(`✅ Retrieved ${allIdentities.length} identities from CRM`);
        return allIdentities;
    }
    async searchIdentities(request) {
        const response = await this.client.post('/api/v2/crmobject/identity/search', request);
        return response.data;
    }
    async createPerson(data) {
        this.logger.log(`➕ Creating person in CRM: ${data.nickName}`);
        this.logger.debug(`   Data: ${JSON.stringify(data, null, 2)}`);
        const response = await this.client.post('/api/v2/crmobject/person/create', data);
        this.logger.log(`✅ Person created: ${response.data.id}`);
        return response.data;
    }
    async createOrganization(data) {
        this.logger.log(`➕ Creating organization in CRM: ${data.nickName}`);
        this.logger.debug(`   Data: ${JSON.stringify(data, null, 2)}`);
        const response = await this.client.post('/api/v2/crmobject/organization/create', data);
        this.logger.log(`✅ Organization created: ${response.data.id}`);
        return response.data;
    }
    async getPerson(identityId) {
        const response = await this.client.post('/api/v2/crmobject/person/get', {
            identityId,
        });
        return response.data;
    }
    async getOrganization(identityId) {
        const response = await this.client.post('/api/v2/crmobject/organization/get', {
            identityId,
        });
        return response.data;
    }
    async checkConnection() {
        try {
            await this.authService.getToken();
            return true;
        }
        catch (error) {
            this.logger.error(`❌ CRM connection failed: ${error.message}`);
            return false;
        }
    }
};
exports.CrmIdentityApiClient = CrmIdentityApiClient;
exports.CrmIdentityApiClient = CrmIdentityApiClient = CrmIdentityApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        crm_auth_service_1.CrmAuthService])
], CrmIdentityApiClient);
//# sourceMappingURL=crm-identity-api.client.js.map