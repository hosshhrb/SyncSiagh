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
var FinanceApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const finance_auth_service_1 = require("./finance-auth.service");
let FinanceApiClient = FinanceApiClient_1 = class FinanceApiClient {
    constructor(configService, httpService, authService) {
        this.configService = configService;
        this.httpService = httpService;
        this.authService = authService;
        this.logger = new common_1.Logger(FinanceApiClient_1.name);
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.baseUrl = this.configService.get('finance.baseUrl') || '';
    }
    async request(method, endpoint, data, idempotencyKey, retryCount = 0) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = await this.authService.getAuthHeaders();
            if (idempotencyKey && (method === 'POST' || method === 'PUT')) {
                headers['Idempotency-Key'] = idempotencyKey;
            }
            this.logger.debug(`${method} ${url}${idempotencyKey ? ` [${idempotencyKey}]` : ''}`);
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
            this.logger.error(`Finance API Error: ${method} ${endpoint}`, axiosError.response?.data || axiosError.message);
            if (axiosError.response?.status === 401 && retryCount === 0) {
                this.logger.warn('Token expired, re-authenticating...');
                this.authService.clearToken();
                return this.request(method, endpoint, data, idempotencyKey, retryCount + 1);
            }
            const shouldRetry = retryCount < this.maxRetries &&
                (!axiosError.response || axiosError.response.status >= 500);
            if (shouldRetry) {
                const delay = this.retryDelay * Math.pow(2, retryCount);
                this.logger.warn(`Retrying in ${delay}ms... (attempt ${retryCount + 1})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.request(method, endpoint, data, idempotencyKey, retryCount + 1);
            }
            throw new Error(`Finance API request failed: ${axiosError.message} - ${JSON.stringify(axiosError.response?.data)}`);
        }
    }
    async getCustomers(page = 1, pageSize = 50, filters) {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
            ...filters,
        });
        return this.request('GET', `/customers?${params}`);
    }
    async getCustomer(customerId) {
        return this.request('GET', `/customers/${customerId}`);
    }
    async createCustomer(customer, idempotencyKey) {
        this.logger.log(`Creating customer: ${customer.name}`);
        return this.request('POST', '/customers', customer, idempotencyKey);
    }
    async updateCustomer(customerId, customer, idempotencyKey) {
        this.logger.log(`Updating customer: ${customerId}`);
        return this.request('PUT', `/customers/${customerId}`, customer, idempotencyKey);
    }
    async getCustomersUpdatedSince(since) {
        const isoDate = since.toISOString();
        const response = await this.request('GET', `/customers?updatedSince=${isoDate}`);
        return response.data || [];
    }
    async getPreInvoices(page = 1, pageSize = 50, filters) {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
            ...filters,
        });
        return this.request('GET', `/preinvoices?${params}`);
    }
    async getPreInvoice(invoiceId) {
        return this.request('GET', `/preinvoices/${invoiceId}`);
    }
    async createPreInvoice(invoice, idempotencyKey) {
        this.logger.log(`Creating pre-invoice for customer: ${invoice.customerId}`);
        return this.request('POST', '/preinvoices', invoice, idempotencyKey);
    }
    async updatePreInvoice(invoiceId, invoice, idempotencyKey) {
        this.logger.log(`Updating pre-invoice: ${invoiceId}`);
        return this.request('PUT', `/preinvoices/${invoiceId}`, invoice, idempotencyKey);
    }
    async getPreInvoicesUpdatedSince(since) {
        const isoDate = since.toISOString();
        const response = await this.request('GET', `/preinvoices?updatedSince=${isoDate}`);
        return response.data || [];
    }
};
exports.FinanceApiClient = FinanceApiClient;
exports.FinanceApiClient = FinanceApiClient = FinanceApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        finance_auth_service_1.FinanceAuthService])
], FinanceApiClient);
//# sourceMappingURL=finance-api.client.js.map