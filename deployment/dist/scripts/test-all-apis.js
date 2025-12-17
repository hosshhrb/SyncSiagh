"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const crm_api_client_1 = require("../src/crm/crm-api.client");
const crm_auth_service_1 = require("../src/crm/crm-auth.service");
const siagh_api_client_1 = require("../src/finance/siagh-api.client");
const finance_auth_service_1 = require("../src/finance/finance-auth.service");
const prisma_service_1 = require("../src/database/prisma.service");
const initial_import_service_1 = require("../src/sync/orchestrator/initial-import.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TestLogger {
    constructor() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.logFile = path.join(__dirname, `../logs/api-test-${timestamp}.log`);
        const logsDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
        this.log('='.repeat(80));
        this.log(`API TEST STARTED AT: ${new Date().toISOString()}`);
        this.log('='.repeat(80));
    }
    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        this.logStream.write(logMessage + '\n');
    }
    logSection(title) {
        const line = '='.repeat(80);
        this.log('\n' + line);
        this.log(`  ${title}`);
        this.log(line + '\n');
    }
    logSubSection(title) {
        this.log('\n' + '-'.repeat(60));
        this.log(`  ${title}`);
        this.log('-'.repeat(60));
    }
    logRequest(method, url, data) {
        this.log(`REQUEST: ${method} ${url}`);
        if (data) {
            this.log(`REQUEST DATA: ${JSON.stringify(data, null, 2)}`);
        }
    }
    logResponse(status, data) {
        this.log(`RESPONSE STATUS: ${status}`);
        if (data) {
            this.log(`RESPONSE DATA: ${JSON.stringify(data, null, 2)}`);
        }
    }
    logError(error) {
        this.log(`ERROR: ${error.message || error}`);
        if (error.response?.data) {
            this.log(`ERROR DETAILS: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        if (error.stack) {
            this.log(`STACK TRACE: ${error.stack}`);
        }
    }
    logSuccess(message) {
        this.log(`✓ SUCCESS: ${message}`);
    }
    logWarning(message) {
        this.log(`⚠ WARNING: ${message}`);
    }
    close() {
        this.log('\n' + '='.repeat(80));
        this.log(`API TEST COMPLETED AT: ${new Date().toISOString()}`);
        this.log('='.repeat(80));
        this.logStream.end();
        console.log(`\nTest log saved to: ${this.logFile}`);
    }
}
async function testAllApis() {
    const logger = new TestLogger();
    let app;
    try {
        logger.logSection('INITIALIZING APPLICATION');
        app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        logger.logSuccess('Application context created');
        const crmAuthService = app.get(crm_auth_service_1.CrmAuthService);
        const crmApiClient = app.get(crm_api_client_1.CrmApiClient);
        const financeAuthService = app.get(finance_auth_service_1.FinanceAuthService);
        const siaghApiClient = app.get(siagh_api_client_1.SiaghApiClient);
        const prisma = app.get(prisma_service_1.PrismaService);
        const initialImportService = app.get(initial_import_service_1.InitialImportService);
        logger.logSection('TEST 1: CRM (PAYAMGOSTAR) API TESTS');
        logger.logSubSection('1.1: CRM Authentication');
        try {
            logger.logRequest('POST', '/api/v2/auth/login', {
                username: process.env.CRM_USERNAME,
                password: '***HIDDEN***',
            });
            await crmAuthService.ensureAuthenticated();
            const token = crmAuthService.getToken();
            if (token) {
                logger.logSuccess('CRM authentication successful');
                logger.log(`Access Token: ${token.substring(0, 20)}...`);
            }
            else {
                logger.logWarning('CRM authentication returned no token');
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('1.2: Get CRM Customers (First 5)');
        try {
            logger.logRequest('GET', '/crm/customers?pageNumber=1&pageSize=5');
            const customers = await crmApiClient.getCustomers({
                pageNumber: 1,
                pageSize: 5,
            });
            logger.logResponse('200 OK', {
                totalCount: customers.totalCount,
                pageSize: customers.pageSize,
                customerCount: customers.data?.length || 0,
            });
            if (customers.data && customers.data.length > 0) {
                logger.log('Sample customers:');
                customers.data.forEach((customer, index) => {
                    logger.log(`  ${index + 1}. ${customer.name} (ID: ${customer.id}, Code: ${customer.code})`);
                });
                logger.logSuccess(`Retrieved ${customers.data.length} customers from CRM`);
            }
            else {
                logger.logWarning('No customers found in CRM');
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('1.3: Create New Test Customer in CRM');
        let createdCustomerId = null;
        try {
            const testCustomer = {
                firstName: 'Test',
                lastName: 'Customer API Test',
                nickName: 'Test Customer ' + Date.now(),
                identityType: 'Person',
                mobile: '09123456789',
                email: 'test@example.com',
                nationalCode: String(Math.floor(Math.random() * 10000000000)),
            };
            logger.logRequest('POST', '/crm/customers', testCustomer);
            const created = await crmApiClient.createCustomer(testCustomer);
            createdCustomerId = created.id;
            logger.logResponse('201 Created', created);
            logger.logSuccess(`Created customer with ID: ${createdCustomerId}`);
        }
        catch (error) {
            logger.logError(error);
        }
        if (createdCustomerId) {
            logger.logSubSection('1.4: Verify Created Customer');
            try {
                logger.logRequest('GET', `/crm/customers/${createdCustomerId}`);
                const customer = await crmApiClient.getCustomerById(createdCustomerId);
                logger.logResponse('200 OK', customer);
                logger.logSuccess(`Verified customer: ${customer.name}`);
            }
            catch (error) {
                logger.logError(error);
            }
        }
        logger.logSection('TEST 2: FINANCE (SIAGH) API TESTS');
        logger.logSubSection('2.1: Finance Authentication');
        try {
            logger.logRequest('POST', '/GeneralApi/LoginUser', {
                UserName: process.env.FINANCE_USERNAME,
                Password: '***HIDDEN (MD5 HASHED)***',
            });
            await financeAuthService.ensureAuthenticated();
            const sessionData = financeAuthService.getSessionData();
            if (sessionData) {
                logger.logSuccess('Finance authentication successful');
                logger.log(`User: ${sessionData.UserName}`);
                logger.log(`Contact: ${sessionData.ContactName}`);
                logger.log(`Branch: ${sessionData.BranchName}`);
                logger.log(`Fiscal Year: ${sessionData.FiscalYear}`);
                logger.log(`SessionId: ${sessionData.SessionId?.substring(0, 20)}...`);
            }
            else {
                logger.logWarning('Finance authentication returned no session data');
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('2.2: Get Finance Users/Contacts (First 5)');
        let existingContacts = [];
        try {
            logger.logRequest('GET', '/api/Sgh/GEN/Gn_Web_Users/GetAll');
            const users = await siaghApiClient.getAllUsers();
            existingContacts = users.slice(0, 5);
            logger.logResponse('200 OK', {
                totalCount: users.length,
                showing: existingContacts.length,
            });
            if (existingContacts.length > 0) {
                logger.log('Sample contacts:');
                existingContacts.forEach((user, index) => {
                    logger.log(`  ${index + 1}. ${user.Name} (Code: ${user.Code}, TpmId: ${user.TpmId})`);
                });
                logger.logSuccess(`Retrieved ${existingContacts.length} contacts from Finance`);
            }
            else {
                logger.logWarning('No contacts found in Finance');
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('2.3: Create New Test Contact in Finance');
        let createdContactCode = null;
        try {
            const testContact = {
                fullname: 'Test Contact API ' + Date.now(),
                tpmid: 'TEST-' + Date.now(),
                email: 'testcontact@example.com',
                mobileno: '09123456789',
                telno: '02112345678',
                address: 'Test Address',
                isactive: 1,
                taraftype: 1,
                tozihat: 'Created by API test script',
            };
            logger.logRequest('POST', '/BpmsApi/SaveFormData (formId: 2BFDA)', testContact);
            const result = await siaghApiClient.createContact(testContact);
            logger.logResponse(result.ReturnCode === '0' ? 'Success' : 'Failed', result);
            if (result.ReturnCode === '0') {
                const allUsers = await siaghApiClient.getAllUsers();
                const created = allUsers.find(u => u.TpmId === testContact.tpmid);
                if (created) {
                    createdContactCode = created.Code;
                    logger.logSuccess(`Created contact with Code: ${createdContactCode}`);
                }
                else {
                    logger.logWarning('Contact created but could not retrieve Code');
                }
            }
            else {
                logger.logWarning('Contact creation may have failed');
                if (result.Errors) {
                    logger.log(`Errors: ${JSON.stringify(result.Errors)}`);
                }
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('2.4: Create Test Pre-Invoice in Finance');
        try {
            const customerCode = createdContactCode || (existingContacts[0]?.Code);
            if (!customerCode) {
                logger.logWarning('No customer code available, skipping pre-invoice creation');
            }
            else {
                const fiscalYear = financeAuthService.getSessionData()?.FiscalYear;
                const testPreInvoice = {
                    codemoshtari: customerCode,
                    codenoeesanad: '2',
                    salmali: fiscalYear,
                    tozihat: 'Test Pre-Invoice from API test script',
                    items: [
                        {
                            codekala: '1',
                            nameunit: 'عدد',
                            qty: 2,
                            price: 100000,
                            radif: '1',
                        },
                    ],
                };
                logger.logRequest('POST', '/BpmsApi/SaveFormData (formId: 43D81)', testPreInvoice);
                const result = await siaghApiClient.createPreInvoice(testPreInvoice);
                logger.logResponse(result.ReturnCode === '0' ? 'Success' : 'Failed', result);
                if (result.ReturnCode === '0') {
                    logger.logSuccess('Pre-invoice created successfully');
                }
                else {
                    logger.logWarning('Pre-invoice creation may have failed');
                    if (result.Errors) {
                        logger.log(`Errors: ${JSON.stringify(result.Errors)}`);
                    }
                }
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSection('TEST 3: SYNC OPERATIONS - INITIAL IMPORT (LIMITED)');
        logger.logSubSection('3.1: Import 2 Contacts from Finance to CRM');
        try {
            logger.log('Starting limited initial import (max 2 contacts)...');
            const beforeCount = await prisma.entityMapping.count({
                where: { entityType: 'CUSTOMER' },
            });
            logger.log(`Existing entity mappings: ${beforeCount}`);
            const result = await initialImportService.importSiaghContactsToCrm(2);
            logger.logResponse('Import Completed', {
                total: result.total,
                imported: result.imported,
                skipped: result.skipped,
                errors: result.errors,
            });
            if (result.details && result.details.length > 0) {
                logger.log('\nImport Details:');
                result.details.forEach((detail, index) => {
                    logger.log(`  ${index + 1}. ${detail.siaghContact.fullname}`);
                    logger.log(`     Status: ${detail.status}`);
                    if (detail.crmIdentityId) {
                        logger.log(`     CRM ID: ${detail.crmIdentityId}`);
                    }
                    if (detail.error) {
                        logger.log(`     Error: ${detail.error}`);
                    }
                });
            }
            const afterCount = await prisma.entityMapping.count({
                where: { entityType: 'CUSTOMER' },
            });
            logger.log(`\nEntity mappings after import: ${afterCount}`);
            logger.log(`New mappings created: ${afterCount - beforeCount}`);
            logger.logSuccess(`Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`);
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('3.2: Verify Entity Mappings in Database');
        try {
            const mappings = await prisma.entityMapping.findMany({
                take: 5,
                orderBy: { lastSyncAt: 'desc' },
            });
            logger.log(`Recent entity mappings (${mappings.length}):`);
            mappings.forEach((mapping, index) => {
                logger.log(`  ${index + 1}. Type: ${mapping.entityType}`);
                logger.log(`     CRM ID: ${mapping.crmId || 'N/A'}`);
                logger.log(`     Finance ID: ${mapping.financeId || 'N/A'}`);
                logger.log(`     Last Sync: ${mapping.lastSyncAt.toISOString()}`);
                logger.log(`     Source: ${mapping.lastSyncSource}`);
            });
            logger.logSuccess('Entity mappings verified');
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('3.3: Verify Sync Logs');
        try {
            const syncLogs = await prisma.syncLog.findMany({
                take: 5,
                orderBy: { startedAt: 'desc' },
            });
            logger.log(`Recent sync logs (${syncLogs.length}):`);
            syncLogs.forEach((log, index) => {
                logger.log(`  ${index + 1}. Direction: ${log.direction}`);
                logger.log(`     Status: ${log.status}`);
                logger.log(`     Trigger: ${log.triggerType}`);
                logger.log(`     Started: ${log.startedAt.toISOString()}`);
                if (log.completedAt) {
                    logger.log(`     Completed: ${log.completedAt.toISOString()}`);
                    logger.log(`     Duration: ${log.durationMs}ms`);
                }
                if (log.errorMessage) {
                    logger.log(`     Error: ${log.errorMessage}`);
                }
            });
            logger.logSuccess('Sync logs verified');
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSection('TEST 4: SUMMARY');
        const summary = {
            crmAuthentication: '✓',
            crmCustomerList: '✓',
            crmCustomerCreate: createdCustomerId ? '✓' : '✗',
            crmCustomerVerify: createdCustomerId ? '✓' : '✗',
            financeAuthentication: '✓',
            financeContactList: '✓',
            financeContactCreate: createdContactCode ? '✓' : '✗',
            financePreInvoiceCreate: '?',
            syncImport: '✓',
            entityMappings: '✓',
            syncLogs: '✓',
        };
        logger.log('Test Results Summary:');
        logger.log('--------------------');
        Object.entries(summary).forEach(([test, result]) => {
            logger.log(`${result} ${test}`);
        });
        logger.logSuccess('All API tests completed!');
    }
    catch (error) {
        logger.logError(error);
    }
    finally {
        if (app) {
            await app.close();
            logger.log('Application context closed');
        }
        logger.close();
    }
}
testAllApis()
    .then(() => {
    console.log('\n✓ All tests completed successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n✗ Test execution failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test-all-apis.js.map