import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityType, SystemType } from '@prisma/client';
import { SiaghApiClient } from '../../finance/siagh-api.client';
import { CrmApiClient } from '../../crm/crm-api.client';
import { EntityMappingRepository } from '../../database/repositories/entity-mapping.repository';
import { SyncLogRepository } from '../../database/repositories/sync-log.repository';
import { CreateSiaghPreInvoiceRequest } from '../../finance/dto/siagh-preinvoice.dto';
import { CrmQuoteDto } from '../../crm/dto/crm-quote.dto';

/**
 * CRM Quote to Siagh Sync Service
 *
 * Syncs quotes/pre-invoices from CRM to Siagh Finance
 * Called when webhook receives quote change from CRM
 */
@Injectable()
export class CrmQuoteToSiaghService {
  private readonly logger = new Logger(CrmQuoteToSiaghService.name);

  constructor(
    private siaghClient: SiaghApiClient,
    private crmApiClient: CrmApiClient,
    private entityMappingRepo: EntityMappingRepository,
    private syncLogRepo: SyncLogRepository,
  ) {}

  /**
   * Sync quote from CRM to Siagh
   *
   * Flow:
   * 1. Fetch quote from CRM
   * 2. Extract codesalemodel from crmObjectTypeCode (e.g., "PI_5" → "5")
   * 3. Transform to Siagh pre-invoice format
   * 4. Get customer code from mapping (CRM identityId → Siagh Code)
   * 5. Create pre-invoice in Siagh
   * 6. Store mapping
   */
  async syncQuote(
    quoteId: string,
    quoteData?: CrmQuoteDto,
    triggerPayload?: any,
  ): Promise<void> {
    const transactionId = uuidv4();

    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('🔄 SYNCING QUOTE: CRM → Siagh');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log(`   Quote ID: ${quoteId}`);
    this.logger.log(`   Transaction ID: ${transactionId}`);
    this.logger.log('');

    let syncLogId: string | undefined;
    let mapping = await this.entityMappingRepo.findByEntityId(
      EntityType.PREINVOICE,
      SystemType.CRM,
      quoteId,
    );

    try {
      // Step 1: Fetch quote from CRM if not provided
      let quote: CrmQuoteDto;
      if (quoteData) {
        quote = quoteData;
        this.logger.log('📥 Step 1: Using quote data from webhook payload');
      } else {
        this.logger.log('📥 Step 1: Fetching quote from CRM...');
        quote = await this.crmApiClient.getQuote(quoteId);
        this.logger.log(`   ✅ Retrieved quote: ${quote.number || quoteId}`);
      }
      this.logger.log('');

      // Step 2: Extract codesalemodel from crmObjectTypeCode
      this.logger.log('🔍 Step 2: Extracting sale model code...');
      const codesalemodel = this.extractSaleModelCode(quote.crmObjectTypeCode);
      this.logger.log(`   CRM Object Type Code: ${quote.crmObjectTypeCode}`);
      this.logger.log(`   ✅ Extracted Sale Model Code: ${codesalemodel}`);
      this.logger.log('');

      // Step 3: Get customer mapping to find Siagh customer code
      this.logger.log('📥 Step 3: Finding customer mapping...');
      const customerMapping = await this.entityMappingRepo.findByEntityId(
        EntityType.CUSTOMER,
        SystemType.CRM,
        quote.identityId,
      );

      if (!customerMapping?.financeId) {
        throw new Error(
          `Customer ${quote.identityId} not found in Siagh. Please sync customer first.`,
        );
      }

      const siaghCustomerCode = customerMapping.financeId;
      this.logger.log(`   ✅ Customer Code in Siagh: ${siaghCustomerCode}`);
      this.logger.log('');

      // Step 4: Transform to Siagh format
      this.logger.log('🔄 Step 4: Transforming to Siagh pre-invoice format...');
      const siaghPreInvoice = this.transformCrmToSiagh(quote, siaghCustomerCode, codesalemodel);
      this.logger.log(`   Customer Code: ${siaghPreInvoice.codemoshtari}`);
      this.logger.log(`   Sale Model Code: ${siaghPreInvoice.codesalemodel}`);
      this.logger.log(`   Items: ${siaghPreInvoice.items.length}`);
      this.logger.log(`   Total: ${this.calculateTotal(siaghPreInvoice.items)}`);
      this.logger.log('');

      // Step 5: Create sync log
      const syncLog = await this.syncLogRepo.create({
        transactionId,
        entityMappingId: mapping?.id,
        direction: 'CRM_TO_FINANCE',
        status: 'IN_PROGRESS',
        triggerType: 'WEBHOOK',
        triggerPayload,
        sourceSystem: SystemType.CRM,
        targetSystem: SystemType.FINANCE,
        sourceEntityId: quoteId,
        sourceData: quote,
      });
      syncLogId = syncLog.id;

      // Step 6: Create pre-invoice in Siagh
      this.logger.log('📝 Step 5: Creating pre-invoice in Siagh...');
      const siaghInvoiceNumber = await this.siaghClient.createPreInvoice(siaghPreInvoice);

      // Step 7: Store mapping
      if (mapping) {
        await this.entityMappingRepo.update(mapping.id, {
          financeId: siaghInvoiceNumber,
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmUpdatedAt: new Date(quote.modifyDate),
          financeUpdatedAt: new Date(),
        });
      } else {
        mapping = await this.entityMappingRepo.create({
          entityType: EntityType.PREINVOICE,
          crmId: quoteId,
          financeId: siaghInvoiceNumber,
          lastSyncSource: SystemType.CRM,
          lastSyncTransactionId: transactionId,
          crmUpdatedAt: new Date(quote.modifyDate),
          financeUpdatedAt: new Date(),
        });

        // Update sync log with the newly created mapping ID
        await this.syncLogRepo.update(syncLogId, {
          entityMappingId: mapping.id,
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
   * Extract sale model code from crmObjectTypeCode
   * Example: "PI_5" → "5"
   * Example: "PI_10" → "10"
   */
  private extractSaleModelCode(crmObjectTypeCode: string): string {
    if (!crmObjectTypeCode) {
      this.logger.warn('⚠️ No crmObjectTypeCode provided, using default "1"');
      return '1';
    }

    // Extract the number after "PI_"
    const match = crmObjectTypeCode.match(/PI_(\d+)/);
    if (match && match[1]) {
      return match[1];
    }

    // If no match, try to extract any number from the code
    const numberMatch = crmObjectTypeCode.match(/\d+/);
    if (numberMatch) {
      return numberMatch[0];
    }

    this.logger.warn(`⚠️ Could not extract sale model code from "${crmObjectTypeCode}", using default "1"`);
    return '1';
  }

  /**
   * Transform CRM quote to Siagh pre-invoice format
   */
  private transformCrmToSiagh(
    crmQuote: CrmQuoteDto,
    siaghCustomerCode: string,
    codesalemodel: string,
  ): CreateSiaghPreInvoiceRequest {
    // Get current fiscal year (default to 1404)
    const currentYear = new Date().getFullYear();
    const fiscalYear = currentYear > 2000 ? currentYear - 621 : 1404; // Convert to Persian year

    // Transform items
    const items = crmQuote.details.map((item, index) => ({
      codekala: item.productCode || item.productId || `ITEM-${index + 1}`,
      nameunit: item.productUnitTypeName || 'عدد', // Use the unit from CRM or default
      qty: item.count,
      price: item.baseUnitPrice,
      mabtakhfif: item.totalDiscount || 0,
      vazn: '0',
      hajm: '0',
      radif: String(index + 1),
    }));

    return {
      codenoeesanad: '2', // پیش فاکتور فروش
      codesalemodel: codesalemodel, // Extracted from crmObjectTypeCode (e.g., "5" from "PI_5")
      salmali: fiscalYear,
      codenoeepardakht: '2', // چک (default)
      codemarkazforush: '', // Will use default from Siagh
      codecontact: '', // Optional
      codemoshtari: siaghCustomerCode, // Customer code in Siagh
      codenoeeforush: '1', // فروش غیر رسمی (default)
      codevaseteh: '', // Optional
      tozihat: crmQuote.description || crmQuote.subject || '',
      namenoesanad: `پیش فاکتور فروش ${crmQuote.crmObjectTypeCode || ''}`.trim(),
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
