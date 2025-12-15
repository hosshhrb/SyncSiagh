import { Injectable, Logger } from '@nestjs/common';
import { SiaghApiClient } from './siagh-api.client';
import {
  FinanceCustomerDto,
  CreateFinanceCustomerDto,
  UpdateFinanceCustomerDto,
} from './dto/finance-customer.dto';
import { CreateSiaghContactRequest } from './dto/siagh-contact.dto';

/**
 * Adapter to convert between generic Finance DTOs and Siagh-specific format
 * This allows the sync service to work with standard DTOs while using Siagh API
 */
@Injectable()
export class FinanceSiaghAdapter {
  private readonly logger = new Logger(FinanceSiaghAdapter.name);

  constructor(private siaghClient: SiaghApiClient) {}

  /**
   * Get customer by ID (Siagh Code)
   */
  async getCustomer(customerId: string): Promise<FinanceCustomerDto> {
    // In Siagh, we need to filter by code
    const contacts = await this.siaghClient.getAllContacts({ Code: customerId });

    if (!contacts || contacts.length === 0) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    return this.mapSiaghToFinance(contacts[0]);
  }

  /**
   * Get customers (with pagination)
   */
  async getCustomers(page = 1, pageSize = 50): Promise<FinanceCustomerDto[]> {
    const allContacts = await this.siaghClient.getAllContacts();

    // Simple pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedContacts = allContacts.slice(start, end);

    return paginatedContacts.map((c) => this.mapSiaghToFinance(c));
  }

  /**
   * Create customer in Siagh
   */
  async createCustomer(
    customer: CreateFinanceCustomerDto,
    idempotencyKey: string,
  ): Promise<FinanceCustomerDto> {
    const siaghContact = this.mapFinanceToSiagh(customer);
    const response = await this.siaghClient.createContact(siaghContact, idempotencyKey);

    if (!this.siaghClient.isSuccessResponse(response)) {
      const errors = this.siaghClient.getErrorMessages(response);
      throw new Error(`Failed to create customer in Siagh: ${errors.join(', ')}`);
    }

    // Return created customer with code from response
    return {
      ...customer,
      id: response.ReturnCode,
      code: response.ReturnCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as FinanceCustomerDto;
  }

  /**
   * Update customer in Siagh
   */
  async updateCustomer(
    customerId: string,
    customer: UpdateFinanceCustomerDto,
    idempotencyKey: string,
  ): Promise<FinanceCustomerDto> {
    // Ensure name is provided for update
    const customerWithName: CreateFinanceCustomerDto = {
      name: customer.name || '',
      ...customer,
    };
    const siaghContact = this.mapFinanceToSiagh(customerWithName);
    const response = await this.siaghClient.updateContact(
      customerId,
      siaghContact,
      idempotencyKey,
    );

    if (!this.siaghClient.isSuccessResponse(response)) {
      const errors = this.siaghClient.getErrorMessages(response);
      throw new Error(`Failed to update customer in Siagh: ${errors.join(', ')}`);
    }

    // Fetch and return updated customer
    return this.getCustomer(customerId);
  }

  /**
   * Map Siagh contact to Finance customer format
   */
  private mapSiaghToFinance(siagh: any): FinanceCustomerDto {
    return {
      id: siagh.Code?.toString() || siagh.code?.toString(),
      code: siagh.Code?.toString() || siagh.code?.toString(),
      name: siagh.FullName || siagh.fullname,
      firstName: undefined,
      lastName: undefined,
      companyName: siagh.FullName || siagh.fullname,
      phone: siagh.TelNo || siagh.telno,
      mobile: siagh.MobileNo || siagh.mobileno,
      email: siagh.Email || siagh.email,
      address: siagh.Address || siagh.address,
      city: siagh.CodeShahr || siagh.codeshahr,
      state: siagh.CodeOstan || siagh.codeostan,
      country: siagh.CountryCode || siagh.countrycode,
      postalCode: siagh.PoCode || siagh.pocode,
      isActive: siagh.IsActive === 1 || siagh.isactive === 1,
      notes: siagh.Tozihat || siagh.tozihat,
      customFields: {
        nickname: siagh.NickName || siagh.nickname,
        tmpid: siagh.TmpId || siagh.tmpid,
        websiteAddress: siagh.WebsiteAddress || siagh.websiteaddress,
        gender: siagh.Gender || siagh.gender,
      },
    };
  }

  /**
   * Map Finance customer to Siagh contact format
   */
  private mapFinanceToSiagh(finance: CreateFinanceCustomerDto): CreateSiaghContactRequest {
    return {
      fullname: finance.name,
      nickname: finance.customFields?.nickname,
      gender: finance.customFields?.gender,
      mobileno: finance.mobile,
      telno: finance.phone,
      email: finance.email,
      websiteaddress: finance.customFields?.websiteAddress,
      address: finance.address,
      codeshahr: finance.city,
      codeostan: finance.state,
      countrycode: finance.country,
      pocode: finance.postalCode,
      tmpid: finance.customFields?.tmpid,
      tozihat: finance.notes,
      isactive: 1,
    };
  }
}

