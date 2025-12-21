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
    quoteDate: string | null;
    expireDate: string | null;
    creatDate: string;
    modifyDate: string;
    quoteType: string;
    billableObjectState: string | null;
    billableObjectStateIndex: number;
    details: CrmQuoteDetailDto[];
    number: string;
    subject: string;
    description: string;
    refId: string;
    crmId: string;
    crmObjectTypeIndexPreview: number | null;
    crmObjectTypeIndex: number;
    crmObjectTypeName: string | null;
    crmObjectTypeId: string;
    crmObjectTypeCode: string;
    parentCrmObjectId: string | null;
    identityId: string;
    identityIdPreview: string | null;
    stageId: string | null;
    creatorId: string;
    creatorIdPreview: string | null;
    modifierId: string;
    modifierIdPreview: string | null;
    assignedToId: string;
    assignedToIdPreview: string | null;
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
