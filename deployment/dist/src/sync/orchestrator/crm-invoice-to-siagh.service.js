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
var CrmInvoiceToSiaghService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmInvoiceToSiaghService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const siagh_api_client_1 = require("../../finance/siagh-api.client");
const crm_api_client_1 = require("../../crm/crm-api.client");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
const sync_log_repository_1 = require("../../database/repositories/sync-log.repository");
let CrmInvoiceToSiaghService = CrmInvoiceToSiaghService_1 = class CrmInvoiceToSiaghService {
    constructor(siaghClient, crmApiClient, entityMappingRepo, syncLogRepo) {
        this.siaghClient = siaghClient;
        this.crmApiClient = crmApiClient;
        this.entityMappingRepo = entityMappingRepo;
        this.syncLogRepo = syncLogRepo;
        this.logger = new common_1.Logger(CrmInvoiceToSiaghService_1.name);
    }
    async syncInvoice(invoiceId, invoiceData, triggerPayload) {
        const transactionId = (0, uuid_1.v4)();
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log('🔄 SYNCING INVOICE: CRM → Siagh');
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log(`   Invoice ID: ${invoiceId}`);
        this.logger.log(`   Transaction ID: ${transactionId}`);
        this.logger.log('');
        let syncLogId;
        let mapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.PREINVOICE, client_1.SystemType.CRM, invoiceId);
        try {
            let invoice;
            if (invoiceData) {
                invoice = invoiceData;
                this.logger.log('📥 Step 1: Using invoice data from webhook payload');
            }
            else {
                this.logger.log('📥 Step 1: Fetching invoice from CRM...');
                invoice = await this.crmApiClient.getInvoice(invoiceId);
                this.logger.log(`   ✅ Retrieved invoice: ${invoice.invoiceNumber || invoiceId}`);
            }
            this.logger.log('');
            this.logger.log('📥 Step 2: Finding customer mapping...');
            const customerMapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.CUSTOMER, client_1.SystemType.CRM, invoice.customerId);
            if (!customerMapping?.financeId) {
                throw new Error(`Customer ${invoice.customerId} not found in Siagh. Please sync customer first.`);
            }
            const siaghCustomerCode = customerMapping.financeId;
            this.logger.log(`   ✅ Customer Code in Siagh: ${siaghCustomerCode}`);
            this.logger.log('');
            this.logger.log('🔄 Step 3: Transforming to Siagh pre-invoice format...');
            const siaghPreInvoice = this.transformCrmToSiagh(invoice, siaghCustomerCode);
            this.logger.log(`   Customer Code: ${siaghPreInvoice.codemoshtari}`);
            this.logger.log(`   Items: ${siaghPreInvoice.items.length}`);
            this.logger.log(`   Total: ${this.calculateTotal(siaghPreInvoice.items)}`);
            this.logger.log('');
            const syncLog = await this.syncLogRepo.create({
                transactionId,
                entityMappingId: mapping?.id || 'pending',
                direction: 'CRM_TO_FINANCE',
                status: 'IN_PROGRESS',
                triggerType: 'WEBHOOK',
                triggerPayload,
                sourceSystem: client_1.SystemType.CRM,
                targetSystem: client_1.SystemType.FINANCE,
                sourceEntityId: invoiceId,
                sourceData: invoice,
            });
            syncLogId = syncLog.id;
            this.logger.log('📝 Step 4: Creating pre-invoice in Siagh...');
            const siaghInvoiceNumber = await this.siaghClient.createPreInvoice(siaghPreInvoice);
            if (mapping) {
                await this.entityMappingRepo.update(mapping.id, {
                    financeId: siaghInvoiceNumber,
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmUpdatedAt: new Date(),
                    financeUpdatedAt: new Date(),
                });
            }
            else {
                mapping = await this.entityMappingRepo.create({
                    entityType: client_1.EntityType.PREINVOICE,
                    crmId: invoiceId,
                    financeId: siaghInvoiceNumber,
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmUpdatedAt: new Date(),
                    financeUpdatedAt: new Date(),
                });
            }
            await this.syncLogRepo.complete(syncLogId, {
                status: 'SUCCESS',
                targetEntityId: siaghInvoiceNumber,
            });
            this.logger.log('═══════════════════════════════════════════════════════════════');
            this.logger.log('✅ SYNC COMPLETE');
            this.logger.log('═══════════════════════════════════════════════════════════════');
            this.logger.log(`   Siagh Invoice Number: ${siaghInvoiceNumber}`);
            this.logger.log('');
        }
        catch (error) {
            this.logger.error('═══════════════════════════════════════════════════════════════');
            this.logger.error('❌ SYNC FAILED');
            this.logger.error('═══════════════════════════════════════════════════════════════');
            this.logger.error(`   Error: ${error.message}`);
            this.logger.error('');
            if (syncLogId) {
                await this.syncLogRepo.complete(syncLogId, {
                    status: 'FAILED',
                    errorMessage: error.message,
                    errorStack: error.stack,
                });
            }
            throw error;
        }
    }
    transformCrmToSiagh(crmInvoice, siaghCustomerCode) {
        const currentYear = new Date().getFullYear();
        const fiscalYear = currentYear > 2000 ? currentYear - 621 : 1404;
        const items = crmInvoice.items.map((item, index) => ({
            codekala: item.productCode || item.productId || `ITEM-${index + 1}`,
            nameunit: 'عدد',
            qty: item.quantity,
            price: item.unitPrice,
            mabtakhfif: item.discount || 0,
            vazn: '0',
            hajm: '0',
            radif: String(index + 1),
        }));
        return {
            codenoeesanad: '2',
            codesalemodel: '1',
            salmali: fiscalYear,
            codenoeepardakht: '2',
            codemarkazforush: '',
            codecontact: '',
            codemoshtari: siaghCustomerCode,
            codenoeeforush: '1',
            codevaseteh: '',
            tozihat: crmInvoice.description || crmInvoice.notes || '',
            namenoesanad: 'پیش فاکتور فروش بنیان گاز',
            items,
        };
    }
    calculateTotal(items) {
        return items.reduce((sum, item) => {
            const itemTotal = item.qty * item.price - (item.mabtakhfif || 0);
            return sum + itemTotal;
        }, 0);
    }
};
exports.CrmInvoiceToSiaghService = CrmInvoiceToSiaghService;
exports.CrmInvoiceToSiaghService = CrmInvoiceToSiaghService = CrmInvoiceToSiaghService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [siagh_api_client_1.SiaghApiClient,
        crm_api_client_1.CrmApiClient,
        entity_mapping_repository_1.EntityMappingRepository,
        sync_log_repository_1.SyncLogRepository])
], CrmInvoiceToSiaghService);
//# sourceMappingURL=crm-invoice-to-siagh.service.js.map