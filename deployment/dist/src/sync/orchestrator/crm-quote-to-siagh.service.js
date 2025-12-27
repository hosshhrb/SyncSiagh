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
var CrmQuoteToSiaghService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmQuoteToSiaghService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const siagh_api_client_1 = require("../../finance/siagh-api.client");
const crm_api_client_1 = require("../../crm/crm-api.client");
const entity_mapping_repository_1 = require("../../database/repositories/entity-mapping.repository");
const sync_log_repository_1 = require("../../database/repositories/sync-log.repository");
let CrmQuoteToSiaghService = CrmQuoteToSiaghService_1 = class CrmQuoteToSiaghService {
    constructor(siaghClient, crmApiClient, entityMappingRepo, syncLogRepo) {
        this.siaghClient = siaghClient;
        this.crmApiClient = crmApiClient;
        this.entityMappingRepo = entityMappingRepo;
        this.syncLogRepo = syncLogRepo;
        this.logger = new common_1.Logger(CrmQuoteToSiaghService_1.name);
    }
    async syncQuote(quoteId, quoteData, triggerPayload) {
        const transactionId = (0, uuid_1.v4)();
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log('🔄 SYNCING QUOTE: CRM → Siagh');
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log(`   Quote ID: ${quoteId}`);
        this.logger.log(`   Transaction ID: ${transactionId}`);
        this.logger.log('');
        let syncLogId;
        let mapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.PREINVOICE, client_1.SystemType.CRM, quoteId);
        try {
            let quote;
            if (quoteData) {
                quote = quoteData;
                this.logger.log('📥 Step 1: Using quote data from webhook payload');
            }
            else {
                this.logger.log('📥 Step 1: Fetching quote from CRM...');
                quote = await this.crmApiClient.getQuote(quoteId);
                this.logger.log(`   ✅ Retrieved quote: ${quote.number || quoteId}`);
            }
            this.logger.log('');
            this.logger.log('🔍 Step 2: Extracting sale model code...');
            const codesalemodel = this.extractSaleModelCode(quote.crmObjectTypeCode);
            this.logger.log(`   CRM Object Type Code: ${quote.crmObjectTypeCode}`);
            this.logger.log(`   ✅ Extracted Sale Model Code: ${codesalemodel}`);
            this.logger.log('');
            this.logger.log('📥 Step 3: Finding customer mapping...');
            const customerMapping = await this.entityMappingRepo.findByEntityId(client_1.EntityType.CUSTOMER, client_1.SystemType.CRM, quote.identityId);
            if (!customerMapping?.financeId) {
                throw new Error(`Customer ${quote.identityId} not found in mapping. Please sync customer first.`);
            }
            const siaghCustomerCode = customerMapping.financeId;
            this.logger.log(`   ✅ Found customer mapping:`);
            this.logger.log(`      CRM Identity ID: ${quote.identityId}`);
            this.logger.log(`      Siagh Customer Code: ${siaghCustomerCode}`);
            const customer = await this.siaghClient.findContactByCustomerNumber(siaghCustomerCode);
            if (!customer) {
                this.logger.error(`   ❌ Customer with code ${siaghCustomerCode} not found in Siagh!`);
                this.logger.error(`      The mapping points to a non-existent customer.`);
                this.logger.error(`      This may happen if the customer was created with incorrect tmpid field.`);
                throw new Error(`Customer code ${siaghCustomerCode} not found in Siagh. Please re-sync the customer first.`);
            }
            this.logger.log(`   ✅ Verified customer exists in Siagh: ${customer.Name}`);
            this.logger.log('');
            this.logger.log('🔄 Step 4: Transforming to Siagh pre-invoice format...');
            const siaghPreInvoice = this.transformCrmToSiagh(quote, siaghCustomerCode, codesalemodel);
            this.logger.log(`   Customer Code: ${siaghPreInvoice.codemoshtari}`);
            this.logger.log(`   Sale Model Code: ${siaghPreInvoice.codesalemodel}`);
            this.logger.log(`   Sales Center Code (codemarkazforush): ${siaghPreInvoice.codemarkazforush}`);
            this.logger.log(`   Intermediary Code (codevaseteh): ${siaghPreInvoice.codevaseteh}`);
            this.logger.log(`   Items: ${siaghPreInvoice.items.length}`);
            this.logger.log(`   Total: ${this.calculateTotal(siaghPreInvoice.items)}`);
            this.logger.log('');
            const syncLog = await this.syncLogRepo.create({
                transactionId,
                entityMappingId: mapping?.id,
                direction: 'CRM_TO_FINANCE',
                status: 'IN_PROGRESS',
                triggerType: 'WEBHOOK',
                triggerPayload,
                sourceSystem: client_1.SystemType.CRM,
                targetSystem: client_1.SystemType.FINANCE,
                sourceEntityId: quoteId,
                sourceData: quote,
            });
            syncLogId = syncLog.id;
            this.logger.log('📝 Step 5: Creating pre-invoice in Siagh...');
            const siaghInvoiceNumber = await this.siaghClient.createPreInvoice(siaghPreInvoice);
            if (mapping) {
                await this.entityMappingRepo.update(mapping.id, {
                    financeId: siaghInvoiceNumber,
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmUpdatedAt: new Date(quote.modifyDate),
                    financeUpdatedAt: new Date(),
                });
            }
            else {
                mapping = await this.entityMappingRepo.create({
                    entityType: client_1.EntityType.PREINVOICE,
                    crmId: quoteId,
                    financeId: siaghInvoiceNumber,
                    lastSyncSource: client_1.SystemType.CRM,
                    lastSyncTransactionId: transactionId,
                    crmUpdatedAt: new Date(quote.modifyDate),
                    financeUpdatedAt: new Date(),
                });
                await this.syncLogRepo.update(syncLogId, {
                    entityMappingId: mapping.id,
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
    extractSaleModelCode(crmObjectTypeCode) {
        if (!crmObjectTypeCode) {
            this.logger.warn('⚠️ No crmObjectTypeCode provided, using default "1"');
            return '1';
        }
        const match = crmObjectTypeCode.match(/PI_(\d+)/);
        if (match && match[1]) {
            return match[1];
        }
        const numberMatch = crmObjectTypeCode.match(/\d+/);
        if (numberMatch) {
            return numberMatch[0];
        }
        this.logger.warn(`⚠️ Could not extract sale model code from "${crmObjectTypeCode}", using default "1"`);
        return '1';
    }
    transformCrmToSiagh(crmQuote, siaghCustomerCode, codesalemodel) {
        const currentYear = new Date().getFullYear();
        const fiscalYear = currentYear > 2000 ? currentYear - 621 : 1404;
        const items = crmQuote.details.map((item, index) => ({
            codekala: item.productCode || item.productId || `ITEM-${index + 1}`,
            nameunit: item.productUnitTypeName || 'عدد',
            qty: item.count,
            price: item.baseUnitPrice,
            mabtakhfif: item.totalDiscount || 0,
            vazn: '0',
            hajm: '0',
            radif: String(index + 1),
        }));
        return {
            codenoeesanad: '2',
            codesalemodel: codesalemodel,
            salmali: fiscalYear,
            codenoeepardakht: '2',
            codemarkazforush: codesalemodel,
            codecontact: '',
            codemoshtari: siaghCustomerCode,
            codenoeeforush: '1',
            codevaseteh: '31',
            tozihat: crmQuote.description || crmQuote.subject || '',
            namenoesanad: `پیش فاکتور فروش ${crmQuote.crmObjectTypeCode || ''}`.trim(),
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
exports.CrmQuoteToSiaghService = CrmQuoteToSiaghService;
exports.CrmQuoteToSiaghService = CrmQuoteToSiaghService = CrmQuoteToSiaghService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [siagh_api_client_1.SiaghApiClient,
        crm_api_client_1.CrmApiClient,
        entity_mapping_repository_1.EntityMappingRepository,
        sync_log_repository_1.SyncLogRepository])
], CrmQuoteToSiaghService);
//# sourceMappingURL=crm-quote-to-siagh.service.js.map