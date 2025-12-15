import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookValidatorService {
  private readonly logger = new Logger(WebhookValidatorService.name);
  private readonly secret: string;

  constructor(private configService: ConfigService) {
    this.secret = this.configService.get<string>('webhook.secret') || '';
  }

  /**
   * Validate webhook signature using HMAC
   */
  validateSignature(payload: string, signature: string): boolean {
    if (!this.secret) {
      this.logger.warn('⚠️ Webhook secret not configured, skipping validation');
      return true; // Allow in development
    }

    try {
      // Generate expected signature
      const expectedSignature = this.generateSignature(payload);

      // Compare signatures (timing-safe comparison)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );

      if (!isValid) {
        this.logger.error('❌ Invalid webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }

      this.logger.debug('✅ Webhook signature validated');
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Signature validation error: ${error.message}`);
      throw new UnauthorizedException('Webhook validation failed');
    }
  }

  /**
   * Generate HMAC signature for payload
   */
  generateSignature(payload: string): string {
    return crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
  }

  /**
   * Extract and validate signature from header
   */
  extractSignature(signatureHeader: string): string {
    if (!signatureHeader) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    // Support multiple formats:
    // - "sha256=abc123" (GitHub style)
    // - "abc123" (plain)
    if (signatureHeader.startsWith('sha256=')) {
      return signatureHeader.substring(7);
    }

    return signatureHeader;
  }
}

