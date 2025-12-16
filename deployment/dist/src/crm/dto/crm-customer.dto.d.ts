export interface CrmIdentityDto {
    identityId: string;
    nickName: string;
    customerNo: string;
}
export interface PhoneContactDto {
    id?: string;
    default?: boolean;
    phoneType?: string;
    phoneNumber: string;
    continuedNumber?: string;
    extension?: string;
}
export interface AddressContactDto {
    id?: string;
    default?: boolean;
    country?: string;
    state?: string;
    city?: string;
    addressType?: string;
    areaCode?: string;
    address: string;
    zipCode?: string;
    zipBox?: string;
    longitude?: number;
    latitude?: number;
}
export interface CategoryDto {
    id?: string;
    key: string;
}
export interface ExtendedPropertyDto {
    value: string;
    userKey: string;
    preview?: {
        name: string;
        object: string;
    };
}
export interface BaseCrmObjectDto {
    crmObjectTypeCode?: string;
    parentCrmObjectId?: string;
    extendedProperties?: ExtendedPropertyDto[];
    tags?: string[];
    refId?: string;
    stageId?: string;
    colorId?: number;
    identityId?: string;
    description?: string;
    subject?: string;
    assignedToUserName?: string;
    nickName: string;
    phoneContacts?: PhoneContactDto[];
    addressContacts?: AddressContactDto[];
    email?: string;
    alternativeEmail?: string;
    website?: string;
    customerNumber?: string;
    customerDate?: string;
    categories?: CategoryDto[];
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
export interface CrmPersonDto extends BaseCrmObjectDto {
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
        organizationId: string;
        personId?: string;
        profession?: string;
        jobType?: string;
        office?: string;
        department?: string;
    }>;
}
export interface CrmOrganizationDto extends BaseCrmObjectDto {
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
        personId: string;
        profession?: string;
        jobType?: string;
        office?: string;
        department?: string;
    }>;
}
export interface CrmCustomerDto {
    id: string;
    code?: string;
    name: string;
    identityType?: 'Person' | 'Organization';
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    nationalCode?: string;
    economicCode?: string;
    registrationNumber?: string;
    taxCode?: string;
    customerType?: string;
    description?: string;
    tags?: string[];
    categories?: CategoryDto[];
    customFields?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
    _crmObject?: CrmPersonDto | CrmOrganizationDto;
}
export interface CreateCrmCustomerDto {
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    nationalCode?: string;
    economicCode?: string;
    registrationNumber?: string;
    customerNumber?: string;
    description?: string;
    customerType?: string;
    identityType?: 'Person' | 'Organization';
}
export interface UpdateCrmCustomerDto extends Partial<CreateCrmCustomerDto> {
    id: string;
}
export interface CrmCustomerListResponse {
    data: CrmCustomerDto[];
    totalCount?: number;
    pageNumber?: number;
    pageSize?: number;
}
export interface CrmCustomerListResponse {
    data: CrmCustomerDto[];
    totalCount?: number;
    pageNumber?: number;
    pageSize?: number;
}
export interface CreateCrmCustomerDto {
    name: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    nationalCode?: string;
    economicCode?: string;
    registrationNumber?: string;
    taxCode?: string;
    customerType?: string;
    category?: string;
    description?: string;
    customFields?: Record<string, any>;
}
export interface UpdateCrmCustomerDto extends Partial<CreateCrmCustomerDto> {
    id: string;
}
