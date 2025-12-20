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
  All,
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
   * CRM sends GET requests with query parameters:
   * - event: "Insert" or "Update"
   * - id: Identity GUID
   * - type: "Identity"
   * - subtype: "مخاطب حقیقی siagh" (Person) or "مخاطب حقوقی" (Organization)
   */
  @All('identity')
  @HttpCode(HttpStatus.OK)
  async handleIdentityWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const eventId = Date.now().toString();

    this.logger.log('');
    this.logger.log('📨 ================== CRM IDENTITY WEBHOOK RECEIVED ==================');
    this.logger.log(`   Event ID: ${eventId}`);
    this.logger.log(`   Timestamp: ${new Date().toISOString()}`);
    this.logger.log(`   Method: ${req.method}`);

    // Parse query parameters (CRM sends data via GET with query params)
    const event = (req.query.event as string) || 'unknown';
    const identityId = (req.query.id as string) || '';
    const type = (req.query.type as string) || '';
    const subtype = (req.query.subtype as string) || '';

    this.logger.log('🔍 Query Parameters:');
    this.logger.log(`   Event: ${event}`);
    this.logger.log(`   ID: ${identityId}`);
    this.logger.log(`   Type: ${type}`);
    this.logger.log(`   Subtype: ${subtype}`);
    this.logger.log('');

    // Determine if Person or Organization based on subtype
    // حقیقی = Person (natural person)
    // حقوقی = Organization (legal entity)
    let identityType: 'Person' | 'Organization';
    if (subtype.includes('حقیقی')) {
      identityType = 'Person';
      this.logger.log('👤 Detected: Person (حقیقی)');
    } else if (subtype.includes('حقوقی')) {
      identityType = 'Organization';
      this.logger.log('🏢 Detected: Organization (حقوقی)');
    } else {
      this.logger.warn(`⚠️  Unknown subtype: ${subtype}, defaulting to Person`);
      identityType = 'Person';
    }

    this.logger.log('========================================================================');
    this.logger.log('');

    try {
      if (!identityId) {
        throw new Error('Missing identity ID in webhook');
      }

      // Queue for async processing
      await this.syncQueue.add(
        'crm-identity-webhook',
        {
          source: 'CRM',
          eventId,
          action: event,  // "Insert" or "Update"
          entityId: identityId,  // The identity GUID
          identityType,  // "Person" or "Organization"
          entityType: 'Identity',
          timestamp: new Date().toISOString(),
          rawPayload: {
            event,
            identityId,
            identityType,
            subtype,
            queryParams: req.query,
          },
        },
        {
          jobId: `crm-identity-${identityId}-${eventId}`,
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
      this.logger.log('');

      // Return success immediately
      return res.json({
        success: true,
        eventId,
        event,
        identityId,
        identityType,
        message: 'Identity webhook received and queued for processing',
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
   * Generic webhook endpoint for testing - Accepts ANY HTTP method and logs EVERYTHING
   *
   * Register this endpoint in ANY platform for testing:
   * URL: http://your-server:3000/webhook/crm/test
   * OR:  http://your-server:3000/webhook/crm/test/anything/you/want
   *
   * Accepts: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS - any method!
   * Logs: Headers, Query Params, Body, IP, Method, URL, etc.
   */
  @All('test*')
  @HttpCode(HttpStatus.OK)
  async handleTestWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
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

    // Log Query Parameters
    if (Object.keys(req.query).length > 0) {
      this.logger.log('🔍 Query Parameters:');
      this.logger.log(JSON.stringify(req.query, null, 2));
      this.logger.log('');
    } else {
      this.logger.log('🔍 Query Parameters: None');
      this.logger.log('');
    }

    // Log ALL headers (including custom ones)
    this.logger.log('📋 All Headers:');
    this.logger.log(JSON.stringify(headers, null, 2));
    this.logger.log('');

    // Log the full payload/body
    this.logger.log('📦 Body/Payload:');
    if (payload && Object.keys(payload).length > 0) {
      this.logger.log(JSON.stringify(payload, null, 2));
    } else if (req.body && Object.keys(req.body).length > 0) {
      this.logger.log(JSON.stringify(req.body, null, 2));
    } else {
      this.logger.log('   (empty or no body)');
    }
    this.logger.log('');

    // Additional debugging info
    this.logger.log('🔬 Additional Info:');
    this.logger.log(`   Content-Type: ${req.get('content-type') || 'N/A'}`);
    this.logger.log(`   Content-Length: ${req.get('content-length') || 'N/A'}`);
    this.logger.log(`   Body Size: ${req.body ? JSON.stringify(req.body).length : 0} bytes`);
    this.logger.log(`   Protocol: ${req.protocol.toUpperCase()}`);
    this.logger.log(`   Secure: ${req.secure ? 'Yes (HTTPS)' : 'No (HTTP)'}`);

    this.logger.log('====================================================================');
    this.logger.log('');

    // Return success with comprehensive info
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
}

