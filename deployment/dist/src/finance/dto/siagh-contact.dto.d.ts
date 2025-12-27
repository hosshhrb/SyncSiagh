export interface SiaghContactDto {
    Code?: number;
    NickName?: string;
    FullName: string;
    Gender?: number;
    MobileNo?: string;
    TelNo?: string;
    Email?: string;
    WebsiteAddress?: string;
    Address?: string;
    CodeShahr?: string;
    CodeOstan?: string;
    CountryCode?: string;
    PoCode?: string;
    tmpid?: string;
    Tozihat?: string;
    IsActive?: number;
    tarafType?: number;
}
export interface SiaghSaveFormRequest {
    formId: string;
    ctrlValues: string;
    parameters: string;
    dataRows: string;
    attachments: string;
    postCode: string;
    flowId: string;
}
export interface SiaghSaveFormResponse {
    Errors: Array<{
        ColName: string;
        Group: string;
        ErrorType: string;
        Description: string;
        ErrorCode: number;
        MessageText: string;
        Solution: string;
        HelpIndex: string;
    }>;
    FinalMessages: string[];
    ReturnValue: boolean;
    ReturnCode: string;
    ReturnParams: string;
}
export interface CreateSiaghContactRequest {
    fullname: string;
    nickname?: string;
    gender?: number;
    mobileno?: string;
    telno?: string;
    email?: string;
    websiteaddress?: string;
    address?: string;
    codeshahr?: string;
    codeostan?: string;
    countrycode?: string;
    pocode?: string;
    passno?: string;
    tmpid?: string;
    tozihat?: string;
    isactive?: number;
    taraftype?: number;
}
