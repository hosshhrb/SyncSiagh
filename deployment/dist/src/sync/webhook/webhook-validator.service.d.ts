import { ConfigService } from '@nestjs/config';
export declare class WebhookValidatorService {
    private configService;
    private readonly logger;
    private readonly secret;
    constructor(configService: ConfigService);
    validateSignature(payload: string, signature: string): boolean;
    generateSignature(payload: string): string;
    extractSignature(signatureHeader: string): string;
}
