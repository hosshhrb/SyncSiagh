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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const webhook_validator_service_1 = require("./webhook-validator.service");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(webhookValidator, syncQueue) {
        this.webhookValidator = webhookValidator;
        this.syncQueue = syncQueue;
        this.logger = new common_1.Logger(WebhookController_1.name);
    }
    async handleCrmWebhook(payload, signature, rawBody) {
        this.logger.log(`📨 Received CRM webhook: ${payload.eventType} - ${payload.entityType}`);
        try {
            const payloadString = JSON.stringify(rawBody);
            const extractedSignature = this.webhookValidator.extractSignature(signature);
            this.webhookValidator.validateSignature(payloadString, extractedSignature);
            if (!payload.eventId || !payload.entityType || !payload.entityId) {
                throw new common_1.BadRequestException('Invalid webhook payload');
            }
            await this.syncQueue.add('webhook-event', {
                source: 'CRM',
                eventId: payload.eventId,
                eventType: payload.eventType,
                entityType: payload.entityType,
                entityId: payload.entityId,
                action: payload.action,
                timestamp: payload.timestamp,
                data: payload.data,
            }, {
                jobId: `crm-webhook-${payload.eventId}`,
                removeOnComplete: 1000,
                removeOnFail: 5000,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });
            this.logger.log(`✅ Webhook queued for processing: ${payload.eventId}`);
            return {
                success: true,
                eventId: payload.eventId,
                message: 'Webhook received and queued for processing',
            };
        }
        catch (error) {
            this.logger.error(`❌ Webhook processing failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async handleFinanceWebhook(payload, signature, rawBody) {
        this.logger.log(`📨 Received Finance webhook`);
        try {
            const payloadString = JSON.stringify(rawBody);
            const extractedSignature = this.webhookValidator.extractSignature(signature);
            this.webhookValidator.validateSignature(payloadString, extractedSignature);
            await this.syncQueue.add('webhook-event', {
                source: 'FINANCE',
                eventId: payload.id || Date.now().toString(),
                entityType: payload.entityType,
                entityId: payload.entityId,
                timestamp: new Date().toISOString(),
                data: payload,
            }, {
                removeOnComplete: 1000,
                removeOnFail: 5000,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });
            this.logger.log(`✅ Finance webhook queued for processing`);
            return {
                success: true,
                message: 'Webhook received and queued for processing',
            };
        }
        catch (error) {
            this.logger.error(`❌ Finance webhook processing failed: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('crm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-webhook-signature')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleCrmWebhook", null);
__decorate([
    (0, common_1.Post)('finance'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-webhook-signature')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleFinanceWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('webhook'),
    __param(1, (0, bullmq_1.InjectQueue)('sync')),
    __metadata("design:paramtypes", [webhook_validator_service_1.WebhookValidatorService,
        bullmq_2.Queue])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map