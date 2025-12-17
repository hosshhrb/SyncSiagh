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
var CrmAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let CrmAuthService = CrmAuthService_1 = class CrmAuthService {
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.logger = new common_1.Logger(CrmAuthService_1.name);
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;
    }
    async getToken() {
        if (this.accessToken && this.expiresAt && new Date() < this.expiresAt) {
            return this.accessToken;
        }
        await this.authenticate();
        if (!this.accessToken) {
            throw new Error('Failed to obtain CRM access token');
        }
        return this.accessToken;
    }
    async authenticate() {
        try {
            const baseUrl = this.configService.get('crm.baseUrl');
            const username = this.configService.get('crm.username');
            const password = this.configService.get('crm.password');
            if (!username || !password) {
                throw new Error('CRM API credentials not configured');
            }
            this.logger.log('Authenticating with Payamgostar CRM...');
            this.logger.log(`   URL: ${baseUrl}/api/v2/auth/login`);
            this.logger.log(`   Username: ${username}`);
            const loginData = {
                username,
                password,
                deviceId: 'SiaghSync-Server',
                platformType: 1,
                os: 'Linux',
                osVersion: '1.0',
                token: '',
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${baseUrl}/api/v2/auth/login`, loginData, {
                timeout: 30000,
            }));
            const { accessToken, refreshToken, expiresAt } = response.data;
            if (!accessToken) {
                throw new Error('No access token received from CRM');
            }
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresAt = new Date(expiresAt);
            this.logger.log('✅ Successfully authenticated with Payamgostar CRM');
            this.logger.log(`   Token expires at: ${expiresAt}`);
        }
        catch (error) {
            this.logger.error('CRM authentication failed', error.message);
            if (error.response?.status === 401) {
                throw new Error('Invalid CRM credentials');
            }
            else if (error.response?.status === 403) {
                throw new Error('Too many login attempts! Try again later.');
            }
            else if (error.response?.status === 402) {
                throw new Error('MobileApp module not available in CRM');
            }
            throw new Error(`CRM authentication failed: ${error.message}`);
        }
    }
    async getAuthHeaders() {
        const token = await this.getToken();
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
    clearToken() {
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;
    }
    async validateToken() {
        try {
            const token = await this.getToken();
            this.logger.log('CRM token validated successfully');
            return !!token;
        }
        catch (error) {
            this.logger.warn('CRM token validation failed', error.message);
            this.clearToken();
            return false;
        }
    }
    async ensureAuthenticated() {
        await this.getToken();
    }
};
exports.CrmAuthService = CrmAuthService;
exports.CrmAuthService = CrmAuthService = CrmAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], CrmAuthService);
//# sourceMappingURL=crm-auth.service.js.map