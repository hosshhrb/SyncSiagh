/**
 * CRM Quote DTOs
 * Based on Payamgostar CRM API response
 */

export interface CrmQuoteDetailDto {
  productCode: string;
  productId: string;
  productName: string;
  isService: boolean;
  baseUnitPrice: number;
  finalUnitPrice: number;
  count: number;
  returnedCount: number;
  totalUnitPrice: number;
  totalDiscount: number;
  totalVat: number;
  totalToll: number;
  discountPercent: number;
  detailDescription: string;
  productUnitTypeName: string;
  serial: string | null;
}

export interface CrmQuoteDto {
  // Pricing
  priceListName: string;
  discount: number;
  vat: number;
  toll: number;
  additionalCosts: number | null;
  totalValue: number;
  finalValue: number;
  discountPercent: number;
  totalDiscountPercent: number;
  vatPercent: number;
  tollPercent: number;

  // Dates
  quoteDate: string | null;
  expireDate: string | null;
  creatDate: string;
  modifyDate: string;

  // Type and status
  quoteType: string; // "Quote"
  billableObjectState: string | null;
  billableObjectStateIndex: number;

  // Line items
  details: CrmQuoteDetailDto[];

  // Document info
  number: string;
  subject: string;
  description: string;
  refId: string;

  // CRM object metadata
  crmId: string;
  crmObjectTypeIndexPreview: number | null;
  crmObjectTypeIndex: number;
  crmObjectTypeName: string | null;
  crmObjectTypeId: string;
  crmObjectTypeCode: string; // e.g., "PI_5" - IMPORTANT for extracting sale model
  parentCrmObjectId: string | null;

  // Relationships
  identityId: string; // Customer ID
  identityIdPreview: string | null;
  stageId: string | null;

  // User tracking
  creatorId: string;
  creatorIdPreview: string | null;
  modifierId: string;
  modifierIdPreview: string | null;
  assignedToId: string;
  assignedToIdPreview: string | null;

  // Additional
  extendedProperties: any[];
  tags: any[];
  processLifePaths: any[];
  color: string | null;
}

export interface CrmQuoteListResponse {
  data: CrmQuoteDto[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}
