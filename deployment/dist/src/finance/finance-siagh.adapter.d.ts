import { SiaghApiClient } from './siagh-api.client';
import { FinanceCustomerDto, CreateFinanceCustomerDto, UpdateFinanceCustomerDto } from './dto/finance-customer.dto';
export declare class FinanceSiaghAdapter {
    private siaghClient;
    private readonly logger;
    constructor(siaghClient: SiaghApiClient);
    getCustomer(customerId: string): Promise<FinanceCustomerDto>;
    getCustomers(page?: number, pageSize?: number): Promise<FinanceCustomerDto[]>;
    createCustomer(customer: CreateFinanceCustomerDto, idempotencyKey: string): Promise<FinanceCustomerDto>;
    updateCustomer(customerId: string, customer: UpdateFinanceCustomerDto, idempotencyKey: string): Promise<FinanceCustomerDto>;
    private mapSiaghToFinance;
    private mapFinanceToSiagh;
}
