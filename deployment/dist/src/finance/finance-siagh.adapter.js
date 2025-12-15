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
var FinanceSiaghAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceSiaghAdapter = void 0;
const common_1 = require("@nestjs/common");
const siagh_api_client_1 = require("./siagh-api.client");
let FinanceSiaghAdapter = FinanceSiaghAdapter_1 = class FinanceSiaghAdapter {
    constructor(siaghClient) {
        this.siaghClient = siaghClient;
        this.logger = new common_1.Logger(FinanceSiaghAdapter_1.name);
    }
    async getCustomer(customerId) {
        const contacts = await this.siaghClient.getAllContacts({ Code: customerId });
        if (!contacts || contacts.length === 0) {
            throw new Error(`Customer not found: ${customerId}`);
        }
        return this.mapSiaghToFinance(contacts[0]);
    }
    async getCustomers(page = 1, pageSize = 50) {
        const allContacts = await this.siaghClient.getAllContacts();
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedContacts = allContacts.slice(start, end);
        return paginatedContacts.map((c) => this.mapSiaghToFinance(c));
    }
    async createCustomer(customer, idempotencyKey) {
        const siaghContact = this.mapFinanceToSiagh(customer);
        const response = await this.siaghClient.createContact(siaghContact, idempotencyKey);
        if (!this.siaghClient.isSuccessResponse(response)) {
            const errors = this.siaghClient.getErrorMessages(response);
            throw new Error(`Failed to create customer in Siagh: ${errors.join(', ')}`);
        }
        return {
            ...customer,
            id: response.ReturnCode,
            code: response.ReturnCode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async updateCustomer(customerId, customer, idempotencyKey) {
        const customerWithName = {
            name: customer.name || '',
            ...customer,
        };
        const siaghContact = this.mapFinanceToSiagh(customerWithName);
        const response = await this.siaghClient.updateContact(customerId, siaghContact, idempotencyKey);
        if (!this.siaghClient.isSuccessResponse(response)) {
            const errors = this.siaghClient.getErrorMessages(response);
            throw new Error(`Failed to update customer in Siagh: ${errors.join(', ')}`);
        }
        return this.getCustomer(customerId);
    }
    mapSiaghToFinance(siagh) {
        return {
            id: siagh.Code?.toString() || siagh.code?.toString(),
            code: siagh.Code?.toString() || siagh.code?.toString(),
            name: siagh.FullName || siagh.fullname,
            firstName: undefined,
            lastName: undefined,
            companyName: siagh.FullName || siagh.fullname,
            phone: siagh.TelNo || siagh.telno,
            mobile: siagh.MobileNo || siagh.mobileno,
            email: siagh.Email || siagh.email,
            address: siagh.Address || siagh.address,
            city: siagh.CodeShahr || siagh.codeshahr,
            state: siagh.CodeOstan || siagh.codeostan,
            country: siagh.CountryCode || siagh.countrycode,
            postalCode: siagh.PoCode || siagh.pocode,
            isActive: siagh.IsActive === 1 || siagh.isactive === 1,
            notes: siagh.Tozihat || siagh.tozihat,
            customFields: {
                nickname: siagh.NickName || siagh.nickname,
                tmpid: siagh.TmpId || siagh.tmpid,
                websiteAddress: siagh.WebsiteAddress || siagh.websiteaddress,
                gender: siagh.Gender || siagh.gender,
            },
        };
    }
    mapFinanceToSiagh(finance) {
        return {
            fullname: finance.name,
            nickname: finance.customFields?.nickname,
            gender: finance.customFields?.gender,
            mobileno: finance.mobile,
            telno: finance.phone,
            email: finance.email,
            websiteaddress: finance.customFields?.websiteAddress,
            address: finance.address,
            codeshahr: finance.city,
            codeostan: finance.state,
            countrycode: finance.country,
            pocode: finance.postalCode,
            tmpid: finance.customFields?.tmpid,
            tozihat: finance.notes,
            isactive: 1,
        };
    }
};
exports.FinanceSiaghAdapter = FinanceSiaghAdapter;
exports.FinanceSiaghAdapter = FinanceSiaghAdapter = FinanceSiaghAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [siagh_api_client_1.SiaghApiClient])
], FinanceSiaghAdapter);
//# sourceMappingURL=finance-siagh.adapter.js.map