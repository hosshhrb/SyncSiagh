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
const loop_detector_service_1 = require("./strategy/loop-detector.service");
const initial_import_service_1 = require("./orchestrator/initial-import.service");
const crm_identity_to_siagh_service_1 = require("./orchestrator/crm-identity-to-siagh.service");
const crm_invoice_to_siagh_service_1 = require("./orchestrator/crm-invoice-to-siagh.service");
const webhook_validator_service_1 = require("./webhook/webhook-validator.service");
const webhook_controller_1 = require("./webhook/webhook.controller");
const crm_webhook_controller_1 = require("./webhook/crm-webhook.controller");
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
        controllers: [webhook_controller_1.WebhookController, crm_webhook_controller_1.CrmWebhookController],
        providers: [
            loop_detector_service_1.LoopDetectorService,
            initial_import_service_1.InitialImportService,
            crm_identity_to_siagh_service_1.CrmIdentityToSiaghService,
            crm_invoice_to_siagh_service_1.CrmInvoiceToSiaghService,
            webhook_validator_service_1.WebhookValidatorService,
            sync_job_processor_1.SyncJobProcessor,
            poll_job_processor_1.PollJobScheduler,
        ],
        exports: [
            initial_import_service_1.InitialImportService,
            crm_identity_to_siagh_service_1.CrmIdentityToSiaghService,
            crm_invoice_to_siagh_service_1.CrmInvoiceToSiaghService,
        ],
    })
], SyncModule);
//# sourceMappingURL=sync.module.js.map