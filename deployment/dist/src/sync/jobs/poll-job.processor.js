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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PollJobScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollJobScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const config_1 = require("@nestjs/config");
const crm_api_client_1 = require("../../crm/crm-api.client");
const finance_api_client_1 = require("../../finance/finance-api.client");
const client_1 = require("@prisma/client");
let PollJobScheduler = PollJobScheduler_1 = class PollJobScheduler {
    constructor(configService, crmClient, financeClient, syncQueue) {
        this.configService = configService;
        this.crmClient = crmClient;
        this.financeClient = financeClient;
        this.syncQueue = syncQueue;
        this.logger = new common_1.Logger(PollJobScheduler_1.name);
        this.lastPollTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.pollIntervalSeconds = this.configService.get('sync.pollIntervalSeconds', 300);
    }
    async pollCrmCustomers() {
        if (!this.configService.get('sync.enableWebhooks', false)) {
            this.logger.log('🔄 Polling CRM for customer changes...');
            try {
                const updatedCustomers = await this.crmClient.getCustomersUpdatedSince(this.lastPollTime);
                if (updatedCustomers.length > 0) {
                    this.logger.log(`Found ${updatedCustomers.length} updated customers in CRM`);
                    const batchSize = 20;
                    for (let i = 0; i < updatedCustomers.length; i += batchSize) {
                        const batch = updatedCustomers.slice(i, i + batchSize);
                        const entityIds = batch.map((c) => c.id);
                        await this.syncQueue.add('poll-sync', {
                            entityType: client_1.EntityType.CUSTOMER,
                            direction: 'CRM_TO_FINANCE',
                            entityIds,
                        });
                    }
                    this.logger.log(`✅ Queued ${updatedCustomers.length} customers for sync`);
                }
                else {
                    this.logger.log(`No updated customers found in CRM`);
                }
                this.lastPollTime = new Date();
            }
            catch (error) {
                this.logger.error(`❌ CRM polling failed: ${error.message}`, error.stack);
            }
        }
    }
    async pollFinanceCustomers() {
        if (!this.configService.get('sync.enableWebhooks', false)) {
            this.logger.log('🔄 Polling Finance for customer changes...');
            try {
                const updatedCustomers = await this.financeClient.getCustomersUpdatedSince(this.lastPollTime);
                if (updatedCustomers.length > 0) {
                    this.logger.log(`Found ${updatedCustomers.length} updated customers in Finance`);
                    const batchSize = 20;
                    for (let i = 0; i < updatedCustomers.length; i += batchSize) {
                        const batch = updatedCustomers.slice(i, i + batchSize);
                        const entityIds = batch.map((c) => c.id);
                        await this.syncQueue.add('poll-sync', {
                            entityType: client_1.EntityType.CUSTOMER,
                            direction: 'FINANCE_TO_CRM',
                            entityIds,
                        });
                    }
                    this.logger.log(`✅ Queued ${updatedCustomers.length} customers for sync`);
                }
                else {
                    this.logger.log(`No updated customers found in Finance`);
                }
            }
            catch (error) {
                this.logger.error(`❌ Finance polling failed: ${error.message}`, error.stack);
            }
        }
    }
    async logSyncStats() {
        try {
            const [waiting, active, completed, failed] = await Promise.all([
                this.syncQueue.getWaitingCount(),
                this.syncQueue.getActiveCount(),
                this.syncQueue.getCompletedCount(),
                this.syncQueue.getFailedCount(),
            ]);
            this.logger.log(`📊 Sync Queue Stats - Waiting: ${waiting}, Active: ${active}, Completed: ${completed}, Failed: ${failed}`);
        }
        catch (error) {
            this.logger.error(`Failed to get queue stats: ${error.message}`);
        }
    }
};
exports.PollJobScheduler = PollJobScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PollJobScheduler.prototype, "logSyncStats", null);
exports.PollJobScheduler = PollJobScheduler = PollJobScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bullmq_1.InjectQueue)('sync')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        crm_api_client_1.CrmApiClient,
        finance_api_client_1.FinanceApiClient,
        bullmq_2.Queue])
], PollJobScheduler);
//# sourceMappingURL=poll-job.processor.js.map