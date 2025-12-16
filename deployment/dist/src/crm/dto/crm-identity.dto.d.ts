export interface CrmIdentitySearchResult {
    identityId: string;
    nickName: string;
    customerNo: string;
}
export interface CrmIdentitySearchRequest {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    identityType?: number;
}
export interface CrmPhoneContact {
    id?: string;
    default?: boolean;
    phoneType?: string;
    phoneNumber: string;
    continuedNumber?: string;
    extension?: string;
}
export interface CrmAddressContact {
    id?: string;
    default?: boolean;
    country?: string;
    state?: string;
    city?: string;
    addressType?: string;
    areaCode?: string;
    address?: string;
    zipCode?: string;
    zipBox?: string;
    longitude?: number;
    latitude?: number;
}
export interface CrmIdentityBase {
    crmObjectTypeCode?: string;
    parentCrmObjectId?: string;
    extendedProperties?: Array<{
        value: string;
        userKey: string;
        preview?: {
            name: string;
            object: string;
        };
    }>;
    tags?: string[];
    refId?: string;
    stageId?: string;
    colorId?: number;
    identityId?: string;
    description?: string;
    subject?: string;
    assignedToUserName?: string;
    nickName: string;
    phoneContacts?: CrmPhoneContact[];
    addressContacts?: CrmAddressContact[];
    email?: string;
    alternativeEmail?: string;
    website?: string;
    customerNumber?: string;
    customerDate?: string;
    categories?: Array<{
        id: string;
        key: string;
    }>;
    dontSms?: boolean;
    dontSocialSms?: boolean;
    dontPhoneCall?: boolean;
    dontEmail?: boolean;
    dontFax?: boolean;
    supportUsername?: string;
    saleUsername?: string;
    otherUsername?: string;
    facebookUsername?: string;
    preferredContactType?: string;
    nationalCode?: string;
    economicCode?: string;
    sourceTypeIndex?: number;
}
export interface CrmCreatePersonRequest extends CrmIdentityBase {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    gender?: string;
    personPrefix?: string;
    degree?: string;
    paymentStatusType?: string;
    areasOfInterest?: string;
    mannerType?: string;
    spouse?: string;
    hobbies?: string;
    children?: string;
    organizations?: Array<{
        id?: string;
        organizationId?: string;
        personId?: string;
        profession?: string;
        jobType?: string;
        office?: string;
        department?: string;
    }>;
}
export interface CrmCreateOrganizationRequest extends CrmIdentityBase {
    businessType?: string;
    registerNumber?: string;
    registerDate?: string;
    shareType?: string;
    trademark?: string;
    ownershipType?: string;
    tradeType?: string;
    managerId?: string;
    employees?: Array<{
        id?: string;
        organizationId?: string;
        personId?: string;
        profession?: string;
        jobType?: string;
        office?: string;
        department?: string;
    }>;
}
export interface CrmCreateIdentityResponse {
    id: string;
    success?: boolean;
    message?: string;
}
