import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { FinanceAuthService } from './finance-auth.service';
import { SiaghContactDto, SiaghSaveFormResponse, CreateSiaghContactRequest } from './dto/siagh-contact.dto';
import { CreateSiaghPreInvoiceRequest } from './dto/siagh-preinvoice.dto';
export declare class SiaghApiClient {
    private configService;
    private httpService;
    private authService;
    private readonly logger;
    private readonly baseUrl;
    private readonly maxRetries;
    private readonly retryDelay;
    private readonly CONTACT_FORM_ID;
    private readonly PREINVOICE_FORM_ID;
    constructor(configService: ConfigService, httpService: HttpService, authService: FinanceAuthService);
    private request;
    getAllContacts(filter?: Record<string, any>): Promise<SiaghContactDto[]>;
    getContactByMobile(mobileNo: string): Promise<SiaghContactDto[]>;
    getContactByTel(telNo: string): Promise<SiaghContactDto[]>;
    createContact(contact: CreateSiaghContactRequest, idempotencyKey: string): Promise<SiaghSaveFormResponse>;
    updateContact(contactCode: string, contact: Partial<CreateSiaghContactRequest>, idempotencyKey: string): Promise<SiaghSaveFormResponse>;
    createPreInvoice(invoice: CreateSiaghPreInvoiceRequest, idempotencyKey: string): Promise<SiaghSaveFormResponse>;
    isSuccessResponse(response: SiaghSaveFormResponse): boolean;
    getErrorMessages(response: SiaghSaveFormResponse): string[];
}
