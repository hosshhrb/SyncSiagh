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
var SiaghApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiaghApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let SiaghApiClient = SiaghApiClient_1 = class SiaghApiClient {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SiaghApiClient_1.name);
        this.sessionId = null;
        this.baseUrl = this.configService.get('finance.apiBaseUrl') || 'http://172.16.16.15';
        this.username = this.configService.get('finance.username') || 'مدیر سیستم';
        this.password = this.configService.get('finance.password') || '92C0ED8C3EC1DD67D834D3005A592A80';
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.client.interceptors.request.use((config) => {
            this.logger.debug(`📤 Siagh Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        });
        this.client.interceptors.response.use((response) => {
            this.logger.debug(`📥 Siagh Response: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            this.logger.error(`❌ Siagh Error: ${error.message}`);
            throw error;
        });
    }
    async login() {
        this.logger.log('🔐 Logging in to Siagh Finance...');
        const response = await this.client.post('/GeneralApi/LoginUser', {
            UserName: this.username,
            Password: this.password,
        });
        this.sessionId = response.data.SessionId || response.data.Token;
        this.logger.log(`✅ Siagh login successful. Session: ${this.sessionId?.substring(0, 8)}...`);
        this.logger.log(`   User: ${response.data.UserName}`);
        this.logger.log(`   Branch: ${response.data.BranchName}`);
        this.logger.log(`   Fiscal Year: ${response.data.FiscalYear}`);
        return response.data;
    }
    async ensureSession() {
        if (!this.sessionId) {
            await this.login();
        }
        return this.sessionId;
    }
    async getAllUsers() {
        const sessionId = await this.ensureSession();
        this.logger.log('📥 Fetching all users from Siagh...');
        const response = await this.client.get('/api/Sgh/GEN/Gn_Web_Users/GetAll', {
            headers: {
                'Authorization': sessionId,
            },
        });
        this.logger.log(`✅ Retrieved ${response.data.length} users from Siagh`);
        return response.data;
    }
    async getUsersFiltered(filter) {
        const sessionId = await this.ensureSession();
        this.logger.log(`📥 Fetching filtered users from Siagh...`);
        this.logger.debug(`   Filter: ${JSON.stringify(filter)}`);
        const response = await this.client.post('/api/Sgh/GEN/Gn_Web_Users/GetAll', filter, {
            headers: {
                'Authorization': sessionId,
            },
        });
        this.logger.log(`✅ Retrieved ${response.data.length} filtered users from Siagh`);
        return response.data;
    }
    async getSessionId() {
        return this.ensureSession();
    }
    async getAllContacts() {
        return this.getAllUsers();
    }
    async checkConnection() {
        try {
            await this.login();
            return true;
        }
        catch (error) {
            this.logger.error(`❌ Siagh connection failed: ${error.message}`);
            return false;
        }
    }
};
exports.SiaghApiClient = SiaghApiClient;
exports.SiaghApiClient = SiaghApiClient = SiaghApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SiaghApiClient);
//# sourceMappingURL=siagh-api.client.js.map