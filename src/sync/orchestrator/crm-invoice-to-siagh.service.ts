import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityType, SystemType } from '@prisma/client';
import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmApiClient } from '../../crm/crm-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { CreateSiaghPreInvoiceRequest } from '../../finance/dto/siagh-preinvoice.dto';
import { CrmInvoiceDto } from '../../crm/dto/crm-invoice.dto';

/**
 * CRM Invoice to Siagh Sync Service
 * 
 * Syncs invoices/pre-invoices from CRM to Siagh Finance
 * Called when webhook receives invoice change from CRM
 */
@Injectable()
export class CrmInvoiceToSiaghService {
  private readonly logger = new Logger(CrmInvoiceToSiaghService.name);

  constructor(
    private siaghClient: SiaghApiClient,
    private crmApiClient: CrmApiClient,
    private entityMappingRepo: EntityMappingRepository,
    private syncLogRepo: SyncLogRepository,
  ) {}

  /**
   * Sync invoice from CRM to Siagh
   * 
   * Flow:
   * 1. Fetch invoice from CRM (if not provided in payload)
   * 2. Transform to Siagh pre-invoice format
   * 3. Get customer code from mapping (CRM customerId → Siagh Code)
   * 4. Create pre-invoice in Siagh
   * 5. Store mapping
   */
  async syncInvoice(
    invoiceId: string,
    invoiceData?: CrmInvoiceDto,
    triggerPayload?: any,
  ): Promise<void> {
    const transactionId = uuidv4();

    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('🔄 SYNCING INVOICE: CRM → Siagh');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log(`   Invoice ID: ${invoiceId}`);
    this.logger.log(`   Transaction ID: ${transactionId}`);
    this.logger.log('');

    let syncLogId: string | undefined;
    let mapping = await this.entityMappingRepo.findByEntityId(
      EntityType.PREINVOICE,
      SystemType.CRM,
      invoiceId,
    );

    try {
      // Step 1: Fetch invoice from CRM if not provided
      let invoice: CrmInvoiceDto;
      if (invoiceData) {
        invoice = invoiceData;
        this.logger.log('📥 Step 1: Using invoice data from webhook payload');
      } else {
        this.logger.log('📥 Step 1: Fetching invoice from CRM...');
        invoice = await this.crmApiClient.getInvoice(invoiceId);
        this.logger.log(`   ✅ Retrieved invoice: ${invoice.invoiceNumber || invoiceId}`);
      }
      this.logger.log('');

      // Step 2: Get customer mapping to find Siagh customer code
      this.logger.log('📥 Step 2: Finding customer mapping...');
      const customerMapping = await this.entityMappingRepo.findByEntityId(
        EntityType.CUSTOMER,
        SystemType.CRM,
        invoice.customerId,
      );

      if (!customerMapping?.financeId) {
        throw new Error(
          `Customer ${invoice.customerId} not found in Siagh. Please sync customer first.`,
        );
      }

      const siaghCustomerCode = customerMapping.financeId;
      this.logger.log(`   ✅ Customer Code in Siagh: ${siaghCustomerCode}`);
      this.logger.log('');

      // Step 3: Transform to Siagh format
      this.logger.log('🔄 Step 3: Transforming to Siagh pre-invoice format...');
      const siaghPreInvoice = this.transformCrmToSiagh(invoice, siaghCustomerCode);
      this.logger.log(`   Customer Code: ${siaghPreInvoice.codemoshtari}`);
      this.logger.log(`   Items: ${siaghPreInvoice.items.length}`);
      this.logger.log(`   Total: ${this.calculateTotal(siaghPreInvoice.items)}`);
      this.logger.log('');

      // Step 4: Create sync log
      const syncLog = await this.syncLogRepo.create({
        transactionId,
        entityMappingId: mapping?.id || 'pending',
        direction: 'CRM_TO_FINANCE',
        status: 'IN_PROGRESS',
        triggerType: 'WEBHOOK',
        triggerPayload,
        sourceSystem: SystemType.CRM,
        targetSystem: SystemType.FINANCE,
        sourceEntityId: invoiceId,
        sourceData: invoice,
      });
      syncLogId = syncLog.id;

      // Step 5: Create pre-invoice in Siagh
      this.logger.log('📝 Step 4: Creating pre-invoice in Siagh...');
      const siaghInvoiceNumber = await this.siaghClient.createPreInvoice(siaghPreInvoice);

      // Step 5: Store mapping
      if (mapping) {
        await this.entityMappingRepo.update(mapping.id, {
          financeId: siaghInvoiceNumber,
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmUpdatedAt: new Date(),
          financeUpdatedAt: new Date(),
        });
      } else {
        mapping = await this.entityMappingRepo.create({
          entityType: EntityType.PREINVOICE,
          crmId: invoiceId,
          financeId: siaghInvoiceNumber,
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmUpdatedAt: new Date(),
          financeUpdatedAt: new Date(),
        });
      }

      await this.syncLogRepo.complete(syncLogId, {
        status: 'SUCCESS',
        targetEntityId: siaghInvoiceNumber,
      });

      this.logger.log('═══════════════════════════════════════════════════════════════');
      this.logger.log('✅ SYNC COMPLETE');
      this.logger.log('═══════════════════════════════════════════════════════════════');
      this.logger.log(`   Siagh Invoice Number: ${siaghInvoiceNumber}`);
      this.logger.log('');

    } catch (error) {
      this.logger.error('═══════════════════════════════════════════════════════════════');
      this.logger.error('❌ SYNC FAILED');
      this.logger.error('═══════════════════════════════════════════════════════════════');
      this.logger.error(`   Error: ${error.message}`);
      this.logger.error('');

      if (syncLogId) {
        await this.syncLogRepo.complete(syncLogId, {
          status: 'FAILED',
          errorMessage: error.message,
          errorStack: error.stack,
        });
      }

      throw error;
    }
  }

  /**
   * Transform CRM invoice to Siagh pre-invoice format
   */
  private transformCrmToSiagh(
    crmInvoice: CrmInvoiceDto,
    siaghCustomerCode: string,
  ): CreateSiaghPreInvoiceRequest {
    // Get current fiscal year (default to 1404)
    const currentYear = new Date().getFullYear();
    const fiscalYear = currentYear > 2000 ? currentYear - 621 : 1404; // Convert to Persian year

    // Transform items
    const items = crmInvoice.items.map((item, index) => ({
      codekala: item.productCode || item.productId || `ITEM-${index + 1}`,
      nameunit: 'عدد', // Default unit
      qty: item.quantity,
      price: item.unitPrice,
      mabtakhfif: item.discount || 0,
      vazn: '0',
      hajm: '0',
      radif: String(index + 1),
    }));

    return {
      codenoeesanad: '2', // پیش فاکتور فروش
      codesalemodel: '1', // بنیان گاز (default)
      salmali: fiscalYear,
      codenoeepardakht: '2', // چک (default)
      codemarkazforush: '', // Will use default from Siagh
      codecontact: '', // Optional
      codemoshtari: siaghCustomerCode, // Customer code in Siagh
      codenoeeforush: '1', // فروش غیر رسمی (default)
      codevaseteh: '', // Optional
      tozihat: crmInvoice.description || crmInvoice.notes || '',
      namenoesanad: 'پیش فاکتور فروش بنیان گاز',
      items,
    };
  }

  /**
   * Calculate total from items
   */
  private calculateTotal(items: CreateSiaghPreInvoiceRequest['items']): number {
    return items.reduce((sum, item) => {
      const itemTotal = item.qty * item.price - (item.mabtakhfif || 0);
      return sum + itemTotal;
    }, 0);
  }
}

