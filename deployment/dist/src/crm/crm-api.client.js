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
var CrmApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const crm_auth_service_1 = require("./crm-auth.service");
let CrmApiClient = CrmApiClient_1 = class CrmApiClient {
    constructor(configService, httpService, authService) {
        this.configService = configService;
        this.httpService = httpService;
        this.authService = authService;
        this.logger = new common_1.Logger(CrmApiClient_1.name);
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.baseUrl = this.configService.get('crm.baseUrl') || '';
    }
    async request(method, endpoint, data, retryCount = 0) {
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
            if (axiosError.response?.status === 401 && retryCount === 0) {
                this.logger.warn('CRM token expired, re-authenticating...');
                this.authService.clearToken();
                return this.request(method, endpoint, data, retryCount + 1);
            }
            const shouldRetry = retryCount < this.maxRetries &&
                (!axiosError.response || axiosError.response.status >= 500);
            if (shouldRetry) {
                const delay = this.retryDelay * Math.pow(2, retryCount);
                this.logger.warn(`Retrying in ${delay}ms... (attempt ${retryCount + 1})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.request(method, endpoint, data, retryCount + 1);
            }
            throw new Error(`CRM API request failed: ${axiosError.message} - ${JSON.stringify(axiosError.response?.data)}`);
        }
    }
    async getCustomers(pageNumber = 1, pageSize = 50, filters) {
        const params = new URLSearchParams({
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
            ...filters,
        });
        return this.request('GET', `/crm/customers?${params}`);
    }
    async getCustomer(customerId) {
        return this.request('GET', `/crm/customers/${customerId}`);
    }
    async createCustomer(customer) {
        this.logger.log(`Creating customer: ${customer.name}`);
        return this.request('POST', '/crm/customers', customer);
    }
    async updateCustomer(customerId, customer) {
        this.logger.log(`Updating customer: ${customerId}`);
        return this.request('PUT', `/crm/customers/${customerId}`, customer);
    }
    async getCustomersUpdatedSince(since) {
        const isoDate = since.toISOString();
        const response = await this.request('GET', `/crm/customers?updatedSince=${isoDate}`);
        return response.data || [];
    }
    async getInvoices(pageNumber = 1, pageSize = 50, filters) {
        const params = new URLSearchParams({
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
            ...filters,
        });
        return this.request('GET', `/crm/invoices?${params}`);
    }
    async getInvoice(invoiceId) {
        return this.request('GET', `/crm/invoices/${invoiceId}`);
    }
    async getInvoicesUpdatedSince(since) {
        const isoDate = since.toISOString();
        const response = await this.request('GET', `/crm/invoices?updatedSince=${isoDate}`);
        return response.data || [];
    }
    async checkWebhookSupport() {
        try {
            await this.request('GET', '/webhooks');
            this.logger.log('✅ CRM webhooks are supported');
            return true;
        }
        catch (error) {
            this.logger.warn('⚠️ CRM webhooks may not be supported');
            return false;
        }
    }
    async registerWebhook(webhookUrl, events) {
        this.logger.log(`Registering webhook: ${webhookUrl}`);
        return this.request('POST', '/webhooks', {
            url: webhookUrl,
            events,
        });
    }
    async listWebhooks() {
        return this.request('GET', '/webhooks');
    }
};
exports.CrmApiClient = CrmApiClient;
exports.CrmApiClient = CrmApiClient = CrmApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        crm_auth_service_1.CrmAuthService])
], CrmApiClient);
//# sourceMappingURL=crm-api.client.js.map