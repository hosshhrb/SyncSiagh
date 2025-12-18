/**
 * CRM Identity DTOs
 * Based on actual API responses from Payamgostar CRM
 */

/**
 * Identity search result from /api/v2/crmobject/identity/search
 */
export interface CrmIdentitySearchResult {
  identityId: string;
  nickName: string;
  customerNo: string;
}

/**
 * Request body for identity search
 */
export interface CrmIdentitySearchRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  identityType?: number;  // 1 = Person, 2 = Organization
}

/**
 * Phone contact for CRM identity
 */
export interface CrmPhoneContact {
  id?: string;
  default?: boolean;
  phoneType?: string;
  phoneNumber: string;
  continuedNumber?: string;
  extension?: string;
}

/**
 * Address contact for CRM identity
 */
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

/**
 * Base identity fields shared by Person and Organization
 */
export interface CrmIdentityBase {
  crmObjectTypeCode?: string;
  parentCrmObjectId?: string;
  extendedProperties?: Array<{
    value: string;
    userKey: string;
    preview?: { name: string; object: string };
  }>;
  tags?: string[];
  refId?: string;           // Store Siagh RecordId here!
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
  categories?: Array<{ id?: string; key: string }>;
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

/**
 * Person create request for /api/v2/crmobject/person/create
 */
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

/**
 * Organization create request for /api/v2/crmobject/organization/create
 */
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

/**
 * CRM create response from person/organization create endpoints
 */
export interface CrmCreateIdentityResponse {
  crmId: string;
  success?: boolean;
  message?: string;
}
