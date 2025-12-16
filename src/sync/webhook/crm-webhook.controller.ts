import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * CRM Webhook Controller
 * 
 * Endpoints for CRM (Payamgostar) to call when entities change
 * These endpoints will be registered in CRM settings
 */
@Controller('webhook/crm')
export class CrmWebhookController {
  private readonly logger = new Logger(CrmWebhookController.name);

  constructor(@InjectQueue('sync') private syncQueue: Queue) {}

  /**
   * Webhook for Identity changes (Person or Organization)
   * 
   * Register this endpoint in CRM:
   * URL: http://your-server:3000/webhook/crm/identity
   * 
   * CRM will call this when:
   * - New identity created
   * - Identity updated
   * - Identity deleted
   */
  @Post('identity')
  @HttpCode(HttpStatus.OK)
  async handleIdentityWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const eventId = Date.now().toString();
    
    this.logger.log('📨 ================== CRM IDENTITY WEBHOOK RECEIVED ==================');
    this.logger.log(`   Event ID: ${eventId}`);
    this.logger.log(`   Timestamp: ${new Date().toISOString()}`);
    
    // Log all headers for debugging
    this.logger.log('📋 Headers:');
    Object.entries(headers).forEach(([key, value]) => {
      if (!key.toLowerCase().includes('authorization')) {
        this.logger.log(`   ${key}: ${value}`);
      } else {
        this.logger.log(`   ${key}: [REDACTED]`);
      }
    });

    // Log the full payload
    this.logger.log('📦 Payload:');
    this.logger.log(JSON.stringify(payload, null, 2));
    this.logger.log('========================================================================');

    try {
      // Extract identity info from payload
      const identityId = payload.identityId || payload.id || payload.entityId;
      const action = payload.action || payload.event || 'unknown';
      const identityType = payload.identityType || payload.type;

      this.logger.log(`📝 Processing: Identity ${identityId}, Action: ${action}, Type: ${identityType}`);

      // Queue for async processing
      await this.syncQueue.add(
        'crm-identity-webhook',
        {
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
        },
        {
          jobId: `crm-identity-${eventId}`,
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`✅ Webhook queued for processing: ${eventId}`);

      // Return success immediately
      return res.json({
        success: true,
        eventId,
        message: 'Webhook received and queued for processing',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`❌ Webhook processing failed: ${error.message}`, error.stack);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Webhook for Invoice changes
   * 
   * Register this endpoint in CRM:
   * URL: http://your-server:3000/webhook/crm/invoice
   * 
   * CRM will call this when:
   * - New invoice created
   * - Invoice updated
   * - Invoice status changed
   */
  @Post('invoice')
  @HttpCode(HttpStatus.OK)
  async handleInvoiceWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const eventId = Date.now().toString();
    
    this.logger.log('📨 ================== CRM INVOICE WEBHOOK RECEIVED ==================');
    this.logger.log(`   Event ID: ${eventId}`);
    this.logger.log(`   Timestamp: ${new Date().toISOString()}`);
    
    // Log all headers
    this.logger.log('📋 Headers:');
    Object.entries(headers).forEach(([key, value]) => {
      if (!key.toLowerCase().includes('authorization')) {
        this.logger.log(`   ${key}: ${value}`);
      } else {
        this.logger.log(`   ${key}: [REDACTED]`);
      }
    });

    // Log the full payload
    this.logger.log('📦 Payload:');
    this.logger.log(JSON.stringify(payload, null, 2));
    this.logger.log('========================================================================');

    try {
      // Extract invoice info from payload
      const invoiceId = payload.invoiceId || payload.id || payload.entityId;
      const action = payload.action || payload.event || 'unknown';

      this.logger.log(`📝 Processing: Invoice ${invoiceId}, Action: ${action}`);

      // Queue for async processing
      await this.syncQueue.add(
        'crm-invoice-webhook',
        {
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
        },
        {
          jobId: `crm-invoice-${eventId}`,
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`✅ Webhook queued for processing: ${eventId}`);

      // Return success immediately
      return res.json({
        success: true,
        eventId,
        message: 'Webhook received and queued for processing',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`❌ Webhook processing failed: ${error.message}`, error.stack);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Generic webhook endpoint for testing
   * 
   * Register this endpoint in CRM for testing:
   * URL: http://your-server:3000/webhook/crm/test
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async handleTestWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const eventId = Date.now().toString();
    
    this.logger.log('📨 ================== CRM TEST WEBHOOK RECEIVED ==================');
    this.logger.log(`   Event ID: ${eventId}`);
    this.logger.log(`   Timestamp: ${new Date().toISOString()}`);
    this.logger.log(`   Method: ${req.method}`);
    this.logger.log(`   URL: ${req.url}`);
    
    // Log ALL headers
    this.logger.log('📋 All Headers:');
    this.logger.log(JSON.stringify(headers, null, 2));

    // Log the full payload
    this.logger.log('📦 Full Payload:');
    this.logger.log(JSON.stringify(payload, null, 2));
    
    // Log raw body if available
    this.logger.log('📄 Raw Body:');
    this.logger.log(JSON.stringify(req.body, null, 2));
    
    this.logger.log('====================================================================');

    // Return success
    return res.json({
      success: true,
      eventId,
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      receivedData: {
        headers: Object.keys(headers),
        payloadKeys: Object.keys(payload || {}),
        payloadSize: JSON.stringify(payload).length,
      },
    });
  }
}

