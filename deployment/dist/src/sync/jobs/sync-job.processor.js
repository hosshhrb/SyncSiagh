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
var SyncJobProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncJobProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
const initial_import_service_1 = require("../orchestrator/initial-import.service");
const crm_identity_to_siagh_service_1 = require("../orchestrator/crm-identity-to-siagh.service");
const crm_invoice_to_siagh_service_1 = require("../orchestrator/crm-invoice-to-siagh.service");
let SyncJobProcessor = SyncJobProcessor_1 = class SyncJobProcessor extends bullmq_1.WorkerHost {
    constructor(initialImportService, identitySyncService, invoiceSyncService) {
        super();
        this.initialImportService = initialImportService;
        this.identitySyncService = identitySyncService;
        this.invoiceSyncService = invoiceSyncService;
        this.logger = new common_1.Logger(SyncJobProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processing job ${job.id}: ${job.name}`);
        try {
            switch (job.name) {
                case 'webhook-event':
                    return await this.processWebhookEvent(job.data);
                case 'crm-identity-webhook':
                    return await this.processCrmIdentityWebhook(job.data);
                case 'crm-invoice-webhook':
                    return await this.processCrmInvoiceWebhook(job.data);
                case 'poll-sync':
                    return await this.processPollSync(job.data);
                default:
                    this.logger.warn(`Unknown job type: ${job.name}`);
            }
        }
        catch (error) {
            this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async processWebhookEvent(data) {
        this.logger.log(`Processing webhook: ${data.source} - ${data.entityType} - ${data.entityId}`);
        const entityType = data.entityType.toUpperCase();
        this.logger.log('📦 Webhook Data:');
        this.logger.log(JSON.stringify(data, null, 2));
        if (entityType === 'CUSTOMER' || entityType === 'IDENTITY') {
            this.logger.log(`Identity webhook received for ${data.entityId}`);
        }
        else if (entityType === 'INVOICE' || entityType === 'PREINVOICE') {
            this.logger.warn(`PreInvoice sync not yet fully implemented`);
        }
        else {
            this.logger.warn(`Unknown entity type: ${entityType}`);
        }
    }
    async processCrmIdentityWebhook(data) {
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log('📥 Processing CRM Identity Webhook');
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log(`   Event ID: ${data.eventId}`);
        this.logger.log(`   Action: ${data.action}`);
        this.logger.log(`   Identity ID: ${data.entityId}`);
        this.logger.log(`   Identity Type: ${data.identityType || 'Unknown'}`);
        this.logger.log(`   Timestamp: ${data.timestamp}`);
        this.logger.log('');
        const identityType = (data.identityType === 'Organization' ||
            data.rawPayload?.identityType === 'Organization')
            ? 'Organization'
            : 'Person';
        try {
            await this.identitySyncService.syncIdentity(data.entityId, identityType, data.rawPayload);
        }
        catch (error) {
            this.logger.error(`❌ Failed to sync identity: ${error.message}`);
            throw error;
        }
    }
    async processCrmInvoiceWebhook(data) {
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log('📥 Processing CRM Invoice Webhook');
        this.logger.log('═══════════════════════════════════════════════════════════════');
        this.logger.log(`   Event ID: ${data.eventId}`);
        this.logger.log(`   Action: ${data.action}`);
        this.logger.log(`   Invoice ID: ${data.entityId}`);
        this.logger.log(`   Timestamp: ${data.timestamp}`);
        this.logger.log('');
        const invoiceData = data.rawPayload?.data || data.rawPayload;
        try {
            await this.invoiceSyncService.syncInvoice(data.entityId, invoiceData?.customerId ? invoiceData : undefined, data.rawPayload);
        }
        catch (error) {
            this.logger.error(`❌ Failed to sync invoice: ${error.message}`);
            throw error;
        }
    }
    async processPollSync(data) {
        this.logger.log(`Processing poll sync: ${data.entityType} - ${data.direction} - ${data.entityIds.length} entities`);
        this.logger.log('⚠️  Poll sync not yet implemented');
    }
    onCompleted(job) {
        this.logger.log(`✅ Job ${job.id} completed`);
    }
    onFailed(job, error) {
        this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);
    }
    onActive(job) {
        this.logger.debug(`⚙️ Job ${job.id} started processing`);
    }
};
exports.SyncJobProcessor = SyncJobProcessor;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], SyncJobProcessor.prototype, "onCompleted", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", void 0)
], SyncJobProcessor.prototype, "onFailed", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], SyncJobProcessor.prototype, "onActive", null);
exports.SyncJobProcessor = SyncJobProcessor = SyncJobProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('sync', {
        concurrency: 5,
    }),
    __metadata("design:paramtypes", [initial_import_service_1.InitialImportService,
        crm_identity_to_siagh_service_1.CrmIdentityToSiaghService,
        crm_invoice_to_siagh_service_1.CrmInvoiceToSiaghService])
], SyncJobProcessor);
//# sourceMappingURL=sync-job.processor.js.map