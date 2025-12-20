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
var CrmWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmWebhookController = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let CrmWebhookController = CrmWebhookController_1 = class CrmWebhookController {
    constructor(syncQueue) {
        this.syncQueue = syncQueue;
        this.logger = new common_1.Logger(CrmWebhookController_1.name);
    }
    async handleIdentityWebhook(payload, headers, req, res) {
        const eventId = Date.now().toString();
        this.logger.log('📨 ================== CRM IDENTITY WEBHOOK RECEIVED ==================');
        this.logger.log(`   Event ID: ${eventId}`);
        this.logger.log(`   Timestamp: ${new Date().toISOString()}`);
        this.logger.log('📋 Headers:');
        Object.entries(headers).forEach(([key, value]) => {
            if (!key.toLowerCase().includes('authorization')) {
                this.logger.log(`   ${key}: ${value}`);
            }
            else {
                this.logger.log(`   ${key}: [REDACTED]`);
            }
        });
        this.logger.log('📦 Payload:');
        this.logger.log(JSON.stringify(payload, null, 2));
        this.logger.log('========================================================================');
        try {
            const identityId = payload.identityId || payload.id || payload.entityId;
            const action = payload.action || payload.event || 'unknown';
            const identityType = payload.identityType || payload.type;
            this.logger.log(`📝 Processing: Identity ${identityId}, Action: ${action}, Type: ${identityType}`);
            await this.syncQueue.add('crm-identity-webhook', {
                source: 'CRM',
                eventId,
                action,
                identityId,
                identityType,
                timestamp: new Date().toISOString(),
                rawPayload: payload,
                headers: {
                    contentType: headers['content-type'],
                    userAgent: headers['user-agent'],
                },
            }, {
                jobId: `crm-identity-${eventId}`,
                removeOnComplete: 1000,
                removeOnFail: 5000,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });
            this.logger.log(`✅ Webhook queued for processing: ${eventId}`);
            return res.json({
                success: true,
                eventId,
                message: 'Webhook received and queued for processing',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error(`❌ Webhook processing failed: ${error.message}`, error.stack);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
    async handleInvoiceWebhook(payload, headers, req, res) {
        const eventId = Date.now().toString();
        this.logger.log('📨 ================== CRM INVOICE WEBHOOK RECEIVED ==================');
        this.logger.log(`   Event ID: ${eventId}`);
        this.logger.log(`   Timestamp: ${new Date().toISOString()}`);
        this.logger.log('📋 Headers:');
        Object.entries(headers).forEach(([key, value]) => {
            if (!key.toLowerCase().includes('authorization')) {
                this.logger.log(`   ${key}: ${value}`);
            }
            else {
                this.logger.log(`   ${key}: [REDACTED]`);
            }
        });
        this.logger.log('📦 Payload:');
        this.logger.log(JSON.stringify(payload, null, 2));
        this.logger.log('========================================================================');
        try {
            const invoiceId = payload.invoiceId || payload.id || payload.entityId;
            const action = payload.action || payload.event || 'unknown';
            this.logger.log(`📝 Processing: Invoice ${invoiceId}, Action: ${action}`);
            await this.syncQueue.add('crm-invoice-webhook', {
                source: 'CRM',
                eventId,
                action,
                invoiceId,
                timestamp: new Date().toISOString(),
                rawPayload: payload,
                headers: {
                    contentType: headers['content-type'],
                    userAgent: headers['user-agent'],
                },
            }, {
                jobId: `crm-invoice-${eventId}`,
                removeOnComplete: 1000,
                removeOnFail: 5000,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });
            this.logger.log(`✅ Webhook queued for processing: ${eventId}`);
            return res.json({
                success: true,
                eventId,
                message: 'Webhook received and queued for processing',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error(`❌ Webhook processing failed: ${error.message}`, error.stack);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
    async handleTestWebhook(payload, headers, req, res) {
        const eventId = Date.now().toString();
        this.logger.log('');
        this.logger.log('🎯 ================== UNIVERSAL WEBHOOK RECEIVED ==================');
        this.logger.log(`   📝 Event ID: ${eventId}`);
        this.logger.log(`   ⏰ Timestamp: ${new Date().toISOString()}`);
        this.logger.log(`   🔧 Method: ${req.method}`);
        this.logger.log(`   🌐 Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
        this.logger.log(`   📍 Path: ${req.path}`);
        this.logger.log(`   🖥️  Client IP: ${req.ip || req.socket.remoteAddress}`);
        this.logger.log(`   👤 User-Agent: ${req.get('user-agent') || 'N/A'}`);
        this.logger.log('');
        if (Object.keys(req.query).length > 0) {
            this.logger.log('🔍 Query Parameters:');
            this.logger.log(JSON.stringify(req.query, null, 2));
            this.logger.log('');
        }
        else {
            this.logger.log('🔍 Query Parameters: None');
            this.logger.log('');
        }
        this.logger.log('📋 All Headers:');
        this.logger.log(JSON.stringify(headers, null, 2));
        this.logger.log('');
        this.logger.log('📦 Body/Payload:');
        if (payload && Object.keys(payload).length > 0) {
            this.logger.log(JSON.stringify(payload, null, 2));
        }
        else if (req.body && Object.keys(req.body).length > 0) {
            this.logger.log(JSON.stringify(req.body, null, 2));
        }
        else {
            this.logger.log('   (empty or no body)');
        }
        this.logger.log('');
        this.logger.log('🔬 Additional Info:');
        this.logger.log(`   Content-Type: ${req.get('content-type') || 'N/A'}`);
        this.logger.log(`   Content-Length: ${req.get('content-length') || 'N/A'}`);
        this.logger.log(`   Body Size: ${req.body ? JSON.stringify(req.body).length : 0} bytes`);
        this.logger.log(`   Protocol: ${req.protocol.toUpperCase()}`);
        this.logger.log(`   Secure: ${req.secure ? 'Yes (HTTPS)' : 'No (HTTP)'}`);
        this.logger.log('====================================================================');
        this.logger.log('');
        return res.json({
            success: true,
            eventId,
            message: 'Universal webhook received and logged successfully',
            timestamp: new Date().toISOString(),
            receivedData: {
                method: req.method,
                path: req.path,
                queryParams: req.query,
                headerCount: Object.keys(headers).length,
                headerKeys: Object.keys(headers),
                bodyKeys: Object.keys(payload || req.body || {}),
                bodySize: payload ? JSON.stringify(payload).length : 0,
                contentType: req.get('content-type'),
                clientIp: req.ip || req.socket.remoteAddress,
            },
        });
    }
};
exports.CrmWebhookController = CrmWebhookController;
__decorate([
    (0, common_1.Post)('identity'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CrmWebhookController.prototype, "handleIdentityWebhook", null);
__decorate([
    (0, common_1.Post)('invoice'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CrmWebhookController.prototype, "handleInvoiceWebhook", null);
__decorate([
    (0, common_1.All)('test*'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CrmWebhookController.prototype, "handleTestWebhook", null);
exports.CrmWebhookController = CrmWebhookController = CrmWebhookController_1 = __decorate([
    (0, common_1.Controller)('webhook/crm'),
    __param(0, (0, bullmq_1.InjectQueue)('sync')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], CrmWebhookController);
//# sourceMappingURL=crm-webhook.controller.js.map