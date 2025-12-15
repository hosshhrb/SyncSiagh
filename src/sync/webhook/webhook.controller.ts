import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WebhookValidatorService } from './webhook-validator.service';

interface CrmWebhookPayload {
  eventId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  action: string;
  timestamp: string;
  data?: any;
}

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private webhookValidator: WebhookValidatorService,
    @InjectQueue('sync') private syncQueue: Queue,
  ) {}

  /**
   * Receive webhook events from CRM
   * Validates signature and queues for async processing
   */
  @Post('crm')
  @HttpCode(HttpStatus.OK)
  async handleCrmWebhook(
    @Body() payload: CrmWebhookPayload,
    @Headers('x-webhook-signature') signature: string,
    @Body() rawBody: any,
  ) {
    this.logger.log(`📨 Received CRM webhook: ${payload.eventType} - ${payload.entityType}`);

    try {
      // 1. Validate signature
      const payloadString = JSON.stringify(rawBody);
      const extractedSignature = this.webhookValidator.extractSignature(signature);
      this.webhookValidator.validateSignature(payloadString, extractedSignature);

      // 2. Validate payload
      if (!payload.eventId || !payload.entityType || !payload.entityId) {
        throw new BadRequestException('Invalid webhook payload');
      }

      // 3. Queue for async processing
      await this.syncQueue.add(
        'webhook-event',
        {
          source: 'CRM',
          eventId: payload.eventId,
          eventType: payload.eventType,
          entityType: payload.entityType,
          entityId: payload.entityId,
          action: payload.action,
          timestamp: payload.timestamp,
          data: payload.data,
        },
        {
          jobId: `crm-webhook-${payload.eventId}`, // Prevent duplicate processing
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`✅ Webhook queued for processing: ${payload.eventId}`);

      // 4. Return immediately
      return {
        success: true,
        eventId: payload.eventId,
        message: 'Webhook received and queued for processing',
      };
    } catch (error) {
      this.logger.error(`❌ Webhook processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Receive webhook events from Finance (if supported)
   */
  @Post('finance')
  @HttpCode(HttpStatus.OK)
  async handleFinanceWebhook(
    @Body() payload: any,
    @Headers('x-webhook-signature') signature: string,
    @Body() rawBody: any,
  ) {
    this.logger.log(`📨 Received Finance webhook`);

    try {
      // Validate signature
      const payloadString = JSON.stringify(rawBody);
      const extractedSignature = this.webhookValidator.extractSignature(signature);
      this.webhookValidator.validateSignature(payloadString, extractedSignature);

      // Queue for async processing
      await this.syncQueue.add(
        'webhook-event',
        {
          source: 'FINANCE',
          eventId: payload.id || Date.now().toString(),
          entityType: payload.entityType,
          entityId: payload.entityId,
          timestamp: new Date().toISOString(),
          data: payload,
        },
        {
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`✅ Finance webhook queued for processing`);

      return {
        success: true,
        message: 'Webhook received and queued for processing',
      };
    } catch (error) {
      this.logger.error(`❌ Finance webhook processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}

