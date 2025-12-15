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
var SiaghApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiaghApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const finance_auth_service_1 = require("./finance-auth.service");
let SiaghApiClient = SiaghApiClient_1 = class SiaghApiClient {
    constructor(configService, httpService, authService) {
        this.configService = configService;
        this.httpService = httpService;
        this.authService = authService;
        this.logger = new common_1.Logger(SiaghApiClient_1.name);
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.CONTACT_FORM_ID = '2BFDA';
        this.PREINVOICE_FORM_ID = '43D81';
        this.baseUrl = this.configService.get('finance.baseUrl') || '';
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
            this.logger.error(`Siagh API Error: ${method} ${endpoint}`, axiosError.response?.data || axiosError.message);
            if (axiosError.response?.status === 401 && retryCount === 0) {
                this.logger.warn('Session expired, re-authenticating...');
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
            throw new Error(`Siagh API request failed: ${axiosError.message} - ${JSON.stringify(axiosError.response?.data)}`);
        }
    }
    async getAllContacts(filter) {
        return this.request('POST', '/api/Sgh/GEN/Gn_Web_Users/GetAll', filter || {});
    }
    async getContactByMobile(mobileNo) {
        return this.getAllContacts({ MobileNo: mobileNo });
    }
    async getContactByTel(telNo) {
        return this.getAllContacts({ TelNo: telNo });
    }
    async createContact(contact, idempotencyKey) {
        this.logger.log(`Creating Siagh contact: ${contact.fullname}`);
        const ctrlValues = [
            `NickName=dbgrid1.#nickname#`,
            `gn_web_users.isactive=${contact.isactive ?? 1}`,
            `gn_web_users.gender=${contact.gender ?? ''}`,
            `gn_web_users.websiteaddress=${contact.websiteaddress ?? ''}`,
            `gn_web_users.pocode=${contact.pocode ?? ''}`,
            `gn_web_users.codeostan=${contact.codeostan ?? ''}`,
            `gn_web_users.address=${contact.address ?? ''}`,
            `gn_web_users.codeshahr=${contact.codeshahr ?? ''}`,
            `gn_web_users.countrycode=${contact.countrycode ?? ''}`,
            `gn_web_users.email=${contact.email ?? ''}`,
            `gn_web_users.fullname=${contact.fullname}`,
            `gn_web_users.mobileno=${contact.mobileno ?? ''}`,
            `gn_web_users.telno=${contact.telno ?? ''}`,
            `gn_web_users.tmpid=${contact.tmpid ?? idempotencyKey}`,
            `gn_web_users.tozihat=${contact.tozihat ?? ''}`,
        ].join('|');
        const request = {
            formId: this.CONTACT_FORM_ID,
            ctrlValues,
            parameters: 'CodeMain=',
            dataRows: '[]',
            attachments: '[]',
            postCode: '1110',
            flowId: '',
        };
        return this.request('POST', '/BpmsApi/SaveFormData', request);
    }
    async updateContact(contactCode, contact, idempotencyKey) {
        this.logger.log(`Updating Siagh contact: ${contactCode}`);
        const ctrlValues = Object.entries(contact)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => `gn_web_users.${key}=${value}`)
            .join('|');
        const request = {
            formId: this.CONTACT_FORM_ID,
            ctrlValues,
            parameters: `CodeMain=${contactCode}`,
            dataRows: '[]',
            attachments: '[]',
            postCode: '1110',
            flowId: '',
        };
        return this.request('POST', '/BpmsApi/SaveFormData', request);
    }
    async createPreInvoice(invoice, idempotencyKey) {
        this.logger.log(`Creating Siagh pre-invoice for customer: ${invoice.codemoshtari}`);
        const fiscalYear = this.authService.getFiscalYear();
        const ctrlValues = [
            `sl_sanad.hssanadstate=8`,
            `sl_sanad.codenoeesanad=${invoice.codenoeesanad ?? '2'}`,
            `sl_sanad.codesalemodel=${invoice.codesalemodel ?? '1'}`,
            `sl_sanad.salmali=${invoice.salmali ?? fiscalYear}`,
            `sl_sanad.codenoeepardakht=${invoice.codenoeepardakht ?? '2'}`,
            `sl_sanad.codemarkazforush=${invoice.codemarkazforush ?? ''}`,
            `sl_sanad.codecontact=${invoice.codecontact ?? ''}`,
            `sl_sanad.codemoshtari=${invoice.codemoshtari}`,
            `sl_sanad.codenoeeforush=${invoice.codenoeeforush ?? '1'}`,
            `sl_sanad.codevaseteh=${invoice.codevaseteh ?? ''}`,
            `sl_sanad.tozihat=${invoice.tozihat ?? ''}`,
            `sl_sanad.namenoesanad=${invoice.namenoesanad ?? 'پیش فاکتور فروش'}`,
        ].join('|');
        const dataRows = [
            {
                name: 'dbgrid1',
                entity: 'sl_rizsanad',
                keyField: 'coderiz',
                data: invoice.items.map((item, index) => ({
                    __uid: { oldValue: `item${index}`, newValue: `item${index}` },
                    _status: { oldValue: 'inserted', newValue: 'inserted' },
                    codekala: { oldValue: null, newValue: item.codekala },
                    nameunit: { oldValue: null, newValue: item.nameunit },
                    qty: { oldValue: null, newValue: item.qty },
                    mabtakhfif: { oldValue: null, newValue: item.mabtakhfif ?? 0 },
                    vazn: { oldValue: null, newValue: item.vazn ?? '0' },
                    hajm: { oldValue: null, newValue: item.hajm ?? '0' },
                    price: { oldValue: null, newValue: item.price },
                    radif: { oldValue: null, newValue: item.radif },
                    finalqty: { oldValue: null, newValue: item.qty },
                    takhfif: { oldValue: null, newValue: null },
                    sumamelinc: { oldValue: null, newValue: null },
                    sumameldec: { oldValue: null, newValue: null },
                })),
            },
        ];
        const request = {
            formId: this.PREINVOICE_FORM_ID,
            ctrlValues,
            parameters: `_In_EditKeys=|_In_Suid=${idempotencyKey}|nocheck=`,
            dataRows: JSON.stringify(dataRows),
            attachments: '[]',
            postCode: '1110',
            flowId: '',
        };
        return this.request('POST', '/BpmsApi/SaveFormData', request);
    }
    isSuccessResponse(response) {
        return response.ReturnValue === true && response.Errors.length === 0;
    }
    getErrorMessages(response) {
        return response.Errors.filter((e) => e.ErrorType !== 'ErrSuccs').map((e) => e.Description);
    }
};
exports.SiaghApiClient = SiaghApiClient;
exports.SiaghApiClient = SiaghApiClient = SiaghApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        finance_auth_service_1.FinanceAuthService])
], SiaghApiClient);
//# sourceMappingURL=siagh-api.client.js.map