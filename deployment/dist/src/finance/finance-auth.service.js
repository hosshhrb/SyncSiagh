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
var FinanceAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let FinanceAuthService = FinanceAuthService_1 = class FinanceAuthService {
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.logger = new common_1.Logger(FinanceAuthService_1.name);
        this.sessionId = null;
        this.token = null;
        this.fiscalYear = null;
    }
    async getSessionId() {
        if (this.sessionId) {
            return this.sessionId;
        }
        await this.authenticate();
        if (!this.sessionId) {
            throw new Error('Failed to obtain Siagh session ID');
        }
        return this.sessionId;
    }
    getFiscalYear() {
        return this.fiscalYear || new Date().getFullYear();
    }
    async authenticate() {
        try {
            const baseUrl = this.configService.get('finance.baseUrl');
            const username = this.configService.get('finance.username');
            const password = this.configService.get('finance.password');
            if (!username || !password) {
                throw new Error('Siagh Finance API credentials not configured');
            }
            this.logger.log('Authenticating with Siagh Finance API...');
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${baseUrl}/GeneralApi/LoginUser`, {
                UserName: username,
                Password: password,
            }));
            const { SessionId, Token, FiscalYear } = response.data;
            if (!SessionId || !Token) {
                throw new Error('No SessionId or Token received from Siagh API');
            }
            this.sessionId = SessionId;
            this.token = Token;
            this.fiscalYear = FiscalYear;
            this.logger.log('✅ Successfully authenticated with Siagh Finance API');
            this.logger.log(`   SessionId: ${SessionId.substring(0, 10)}...`);
            this.logger.log(`   Fiscal Year: ${FiscalYear}`);
        }
        catch (error) {
            this.logger.error('Siagh Finance authentication failed', error.message);
            throw new Error(`Siagh Finance authentication failed: ${error.message}`);
        }
    }
    async getAuthHeaders() {
        const sessionId = await this.getSessionId();
        return {
            Authorization: sessionId,
            'Content-Type': 'application/json',
        };
    }
    clearToken() {
        this.sessionId = null;
        this.token = null;
        this.fiscalYear = null;
    }
    async validateSession() {
        try {
            if (!this.sessionId) {
                return false;
            }
            const baseUrl = this.configService.get('finance.baseUrl');
            const headers = await this.getAuthHeaders();
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${baseUrl}/api/Sgh/GEN/Gn_Web_Users/GetAll`, {
                headers,
                timeout: 5000,
            }));
            this.logger.log('Siagh Finance session validated successfully');
            return response.status === 200;
        }
        catch (error) {
            this.logger.warn('Siagh Finance session validation failed', error.message);
            this.clearToken();
            return false;
        }
    }
};
exports.FinanceAuthService = FinanceAuthService;
exports.FinanceAuthService = FinanceAuthService = FinanceAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], FinanceAuthService);
//# sourceMappingURL=finance-auth.service.js.map