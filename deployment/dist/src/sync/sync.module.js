"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const crm_module_1 = require("../crm/crm.module");
const finance_module_1 = require("../finance/finance.module");
const database_module_1 = require("../database/database.module");
const conflict_resolver_service_1 = require("./strategy/conflict-resolver.service");
const loop_detector_service_1 = require("./strategy/loop-detector.service");
const customer_sync_service_1 = require("./orchestrator/customer-sync.service");
const customer_sync_simplified_service_1 = require("./orchestrator/customer-sync-simplified.service");
const initial_sync_service_1 = require("./orchestrator/initial-sync.service");
const webhook_validator_service_1 = require("./webhook/webhook-validator.service");
const webhook_controller_1 = require("./webhook/webhook.controller");
const sync_job_processor_1 = require("./jobs/sync-job.processor");
const poll_job_processor_1 = require("./jobs/poll-job.processor");
let SyncModule = class SyncModule {
};
exports.SyncModule = SyncModule;
exports.SyncModule = SyncModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'sync',
            }),
            crm_module_1.CrmModule,
            finance_module_1.FinanceModule,
            database_module_1.DatabaseModule,
        ],
        controllers: [webhook_controller_1.WebhookController],
        providers: [
            conflict_resolver_service_1.ConflictResolverService,
            loop_detector_service_1.LoopDetectorService,
            customer_sync_service_1.CustomerSyncService,
            customer_sync_simplified_service_1.CustomerSyncSimplifiedService,
            initial_sync_service_1.InitialSyncService,
            webhook_validator_service_1.WebhookValidatorService,
            sync_job_processor_1.SyncJobProcessor,
            poll_job_processor_1.PollJobScheduler,
        ],
        exports: [customer_sync_service_1.CustomerSyncService, customer_sync_simplified_service_1.CustomerSyncSimplifiedService, initial_sync_service_1.InitialSyncService],
    })
], SyncModule);
//# sourceMappingURL=sync.module.js.map