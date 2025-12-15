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
const customer_sync_service_1 = require("../orchestrator/customer-sync.service");
const client_1 = require("@prisma/client");
let SyncJobProcessor = SyncJobProcessor_1 = class SyncJobProcessor extends bullmq_1.WorkerHost {
    constructor(customerSyncService) {
        super();
        this.customerSyncService = customerSyncService;
        this.logger = new common_1.Logger(SyncJobProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processing job ${job.id}: ${job.name}`);
        try {
            switch (job.name) {
                case 'webhook-event':
                    return await this.processWebhookEvent(job.data);
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
        if (entityType === 'CUSTOMER') {
            if (data.source === 'CRM') {
                await this.customerSyncService.syncFromCrmToFinance(data.entityId, 'WEBHOOK', data);
            }
            else {
                await this.customerSyncService.syncFromFinanceToCrm(data.entityId, 'WEBHOOK', data);
            }
        }
        else if (entityType === 'INVOICE' || entityType === 'PREINVOICE') {
            this.logger.warn(`PreInvoice sync not yet implemented`);
        }
        else {
            this.logger.warn(`Unknown entity type: ${entityType}`);
        }
    }
    async processPollSync(data) {
        this.logger.log(`Processing poll sync: ${data.entityType} - ${data.direction} - ${data.entityIds.length} entities`);
        const promises = data.entityIds.map(async (entityId) => {
            try {
                if (data.entityType === client_1.EntityType.CUSTOMER) {
                    if (data.direction === 'CRM_TO_FINANCE') {
                        await this.customerSyncService.syncFromCrmToFinance(entityId, 'POLL');
                    }
                    else {
                        await this.customerSyncService.syncFromFinanceToCrm(entityId, 'POLL');
                    }
                }
            }
            catch (error) {
                this.logger.error(`Failed to sync entity ${entityId}: ${error.message}`);
            }
        });
        await Promise.all(promises);
        this.logger.log(`Completed poll sync for ${data.entityIds.length} entities`);
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
    __metadata("design:paramtypes", [customer_sync_service_1.CustomerSyncService])
], SyncJobProcessor);
//# sourceMappingURL=sync-job.processor.js.map