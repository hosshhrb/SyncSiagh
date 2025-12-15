"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhookValidatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookValidatorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let WebhookValidatorService = WebhookValidatorService_1 = class WebhookValidatorService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WebhookValidatorService_1.name);
        this.secret = this.configService.get('webhook.secret') || '';
    }
    validateSignature(payload, signature) {
        if (!this.secret) {
            this.logger.warn('⚠️ Webhook secret not configured, skipping validation');
            return true;
        }
        try {
            const expectedSignature = this.generateSignature(payload);
            const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
            if (!isValid) {
                this.logger.error('❌ Invalid webhook signature');
                throw new common_1.UnauthorizedException('Invalid webhook signature');
            }
            this.logger.debug('✅ Webhook signature validated');
            return true;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Signature validation error: ${error.message}`);
            throw new common_1.UnauthorizedException('Webhook validation failed');
        }
    }
    generateSignature(payload) {
        return crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
    }
    extractSignature(signatureHeader) {
        if (!signatureHeader) {
            throw new common_1.UnauthorizedException('Missing webhook signature');
        }
        if (signatureHeader.startsWith('sha256=')) {
            return signatureHeader.substring(7);
        }
        return signatureHeader;
    }
};
exports.WebhookValidatorService = WebhookValidatorService;
exports.WebhookValidatorService = WebhookValidatorService = WebhookValidatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WebhookValidatorService);
//# sourceMappingURL=webhook-validator.service.js.map