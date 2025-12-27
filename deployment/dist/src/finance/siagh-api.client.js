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
    async findContactByTmpId(tmpid) {
        const allUsers = await this.getAllUsers();
        return allUsers.find(u => u.tmpid === tmpid) || null;
    }
    async findContactByRecordId(recordId) {
        const allUsers = await this.getAllUsers();
        return allUsers.find(u => u.RecordId === recordId) || null;
    }
    async findContactByCustomerNumber(customerNumber) {
        const code = parseInt(customerNumber, 10);
        if (isNaN(code)) {
            return null;
        }
        const allUsers = await this.getAllUsers();
        return allUsers.find(u => u.Code === code) || null;
    }
    async createContact(data) {
        const sessionId = await this.ensureSession();
        this.logger.log(`➕ Creating contact in Siagh: ${data.fullname}`);
        const ctrlValues = [
            'NickName=dbgrid1.#nickname#',
            `gn_web_users.isactive=${data.isactive ?? 1}`,
            `gn_web_users.gender=${data.gender ?? ''}`,
            `gn_web_users.websiteaddress=${data.websiteaddress ?? ''}`,
            `gn_web_users.pocode=${data.pocode ?? ''}`,
            `gn_web_users.codeostan=${data.codeostan ?? ''}`,
            `gn_web_users.address=${data.address ?? ''}`,
            `gn_web_users.codeshahr=${data.codeshahr ?? ''}`,
            `gn_web_users.countrycode=${data.countrycode ?? ''}`,
            `gn_web_users.email=${data.email ?? ''}`,
            `gn_web_users.fullname=${data.fullname}`,
            `gn_web_users.mobileno=${data.mobileno ?? ''}`,
            `gn_web_users.telno=${data.telno ?? ''}`,
            `gn_web_users.tmpid=${data.tmpid ?? ''}`,
            `gn_web_users.tozihat=${data.tozihat ?? ''}`,
            `gn_web_users.taraftype=${data.taraftype ?? 0}`,
        ].join('|');
        const requestBody = {
            formId: '2BFDA',
            ctrlValues,
            parameters: 'CodeMain=',
            dataRows: '[]',
            attachments: '[]',
            postCode: '1110',
            flowId: '',
        };
        this.logger.debug(`   Request: ${JSON.stringify(requestBody, null, 2)}`);
        const response = await this.client.post('/BpmsApi/SaveFormData', requestBody, {
            headers: {
                'Authorization': sessionId,
            },
        });
        const errors = response.data.Errors?.filter(e => e.ErrorType === 'ErrError') || [];
        if (errors.length > 0) {
            const errorMsg = errors.map(e => e.Description).join('; ');
            this.logger.error(`❌ Failed to create contact: ${errorMsg}`);
            throw new Error(`Siagh API error: ${errorMsg}`);
        }
        const contactCode = response.data.ReturnCode;
        this.logger.log(`✅ Contact created with code: ${contactCode}`);
        return contactCode;
    }
    async updateContact(code, data) {
        const sessionId = await this.ensureSession();
        this.logger.log(`🔄 Updating contact in Siagh: ${data.fullname} (Code: ${code})`);
        const ctrlValues = [
            'NickName=dbgrid1.#nickname#',
            `gn_web_users.isactive=${data.isactive ?? 1}`,
            `gn_web_users.gender=${data.gender ?? ''}`,
            `gn_web_users.websiteaddress=${data.websiteaddress ?? ''}`,
            `gn_web_users.pocode=${data.pocode ?? ''}`,
            `gn_web_users.codeostan=${data.codeostan ?? ''}`,
            `gn_web_users.address=${data.address ?? ''}`,
            `gn_web_users.codeshahr=${data.codeshahr ?? ''}`,
            `gn_web_users.countrycode=${data.countrycode ?? ''}`,
            `gn_web_users.email=${data.email ?? ''}`,
            `gn_web_users.fullname=${data.fullname}`,
            `gn_web_users.mobileno=${data.mobileno ?? ''}`,
            `gn_web_users.telno=${data.telno ?? ''}`,
            `gn_web_users.tmpid=${data.tmpid ?? ''}`,
            `gn_web_users.tozihat=${data.tozihat ?? ''}`,
            `gn_web_users.taraftype=${data.taraftype ?? 0}`,
        ].join('|');
        const requestBody = {
            formId: '2BFDA',
            ctrlValues,
            parameters: `CodeMain=${code}`,
            dataRows: '[]',
            attachments: '[]',
            postCode: '1110',
            flowId: '',
        };
        this.logger.debug(`   Request: ${JSON.stringify(requestBody, null, 2)}`);
        const response = await this.client.post('/BpmsApi/SaveFormData', requestBody, {
            headers: {
                'Authorization': sessionId,
            },
        });
        const errors = response.data.Errors?.filter(e => e.ErrorType === 'ErrError') || [];
        if (errors.length > 0) {
            const errorMsg = errors.map(e => e.Description).join('; ');
            this.logger.error(`❌ Failed to update contact: ${errorMsg}`);
            throw new Error(`Siagh API error: ${errorMsg}`);
        }
        const returnedCode = response.data.ReturnCode || code;
        this.logger.debug(`   Response ReturnCode: ${returnedCode} (Expected: ${code})`);
        this.logger.log(`✅ Contact updated successfully`);
        return returnedCode;
    }
    async createPreInvoice(data) {
        const sessionId = await this.ensureSession();
        this.logger.log(`➕ Creating pre-invoice in Siagh for customer: ${data.codemoshtari}`);
        const ctrlValues = [
            'sl_sanad.hssanadstate=8',
            `sl_sanad.codenoeesanad=${data.codenoeesanad ?? '2'}`,
            `sl_sanad.codesalemodel=${data.codesalemodel ?? '1'}`,
            `sl_sanad.salmali=${data.salmali ?? 1404}`,
            `sl_sanad.codenoeepardakht=${data.codenoeepardakht ?? '2'}`,
            `sl_sanad.codemarkazforush=${data.codemarkazforush ?? ''}`,
            `sl_sanad.codecontact=${data.codecontact ?? ''}`,
            `sl_sanad.codemoshtari=${data.codemoshtari}`,
            `sl_sanad.codenoeeforush=${data.codenoeeforush ?? '1'}`,
            `sl_sanad.codevaseteh=${data.codevaseteh ?? ''}`,
            `sl_sanad.tozihat=${data.tozihat ?? ''}`,
            `sl_sanad.namenoesanad=${data.namenoesanad ?? 'پیش فاکتور فروش بنیان گاز'}`,
        ].join('|');
        const dataRows = JSON.stringify([{
                name: 'dbgrid1',
                entity: 'sl_rizsanad',
                keyField: 'coderiz',
                data: data.items.map((item, index) => ({
                    __uid: {
                        oldValue: `item-${index}`,
                        newValue: `item-${index}`,
                    },
                    _status: {
                        oldValue: 'inserted',
                        newValue: 'inserted',
                    },
                    codekala: {
                        oldValue: null,
                        newValue: item.codekala,
                    },
                    nameunit: {
                        oldValue: null,
                        newValue: item.nameunit,
                    },
                    qty: {
                        oldValue: null,
                        newValue: item.qty,
                    },
                    mabtakhfif: {
                        oldValue: null,
                        newValue: item.mabtakhfif ?? 0,
                    },
                    vazn: {
                        oldValue: null,
                        newValue: item.vazn ?? '0',
                    },
                    hajm: {
                        oldValue: null,
                        newValue: item.hajm ?? '0',
                    },
                    price: {
                        oldValue: null,
                        newValue: item.price,
                    },
                    radif: {
                        oldValue: null,
                        newValue: item.radif ?? String(index + 1),
                    },
                    finalqty: {
                        oldValue: null,
                        newValue: item.qty,
                    },
                    takhfif: {
                        oldValue: null,
                        newValue: null,
                    },
                    sumamelinc: {
                        oldValue: null,
                        newValue: null,
                    },
                    sumameldec: {
                        oldValue: null,
                        newValue: null,
                    },
                })),
            }]);
        const requestBody = {
            formId: '43D81',
            ctrlValues,
            parameters: '_In_EditKeys=|_In_Suid=' + this.generateUUID() + '|nocheck=',
            dataRows,
            attachments: '[]',
            postCode: '1110',
            flowId: '',
        };
        this.logger.debug(`   Request: ${JSON.stringify(requestBody, null, 2)}`);
        const response = await this.client.post('/BpmsApi/SaveFormData', requestBody, {
            headers: {
                'Authorization': sessionId,
            },
        });
        const errors = response.data.Errors?.filter(e => e.ErrorType === 'ErrError') || [];
        if (errors.length > 0) {
            const errorMsg = errors.map(e => e.Description).join('; ');
            this.logger.error(`❌ Failed to create pre-invoice: ${errorMsg}`);
            throw new Error(`Siagh API error: ${errorMsg}`);
        }
        const successMsg = response.data.FinalMessages?.[0] || '';
        const invoiceMatch = successMsg.match(/شماره\s+(\d+)/);
        const invoiceNumber = invoiceMatch ? invoiceMatch[1] : response.data.ReturnCode;
        this.logger.log(`✅ Pre-invoice created with number: ${invoiceNumber}`);
        return invoiceNumber;
    }
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    }
};
exports.SiaghApiClient = SiaghApiClient;
exports.SiaghApiClient = SiaghApiClient = SiaghApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SiaghApiClient);
//# sourceMappingURL=siagh-api.client.js.map