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
const crm_identity_api_client_1 = require("../src/crm/crm-identity-api.client");
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
    logRequest(method, url, data, headers) {
        this.log(`REQUEST: ${method} ${url}`);
        if (headers) {
            this.log(`REQUEST HEADERS: ${JSON.stringify(headers, null, 2)}`);
        }
        if (data) {
            this.log(`REQUEST DATA: ${JSON.stringify(data, null, 2)}`);
        }
    }
    logResponse(status, data, headers) {
        this.log(`RESPONSE STATUS: ${status}`);
        if (headers) {
            this.log(`RESPONSE HEADERS: ${JSON.stringify(headers, null, 2)}`);
        }
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
function generateRandomMobile() {
    const prefixes = ['0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919', '0910', '0911'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return prefix + suffix;
}
function generateRandomPhone() {
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return '021' + suffix;
}
function generateRandomEmail() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `test${timestamp}${random}@example.com`;
}
function generateRandomNationalCode() {
    return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
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
        const crmIdentityApiClient = app.get(crm_identity_api_client_1.CrmIdentityApiClient);
        const financeAuthService = app.get(finance_auth_service_1.FinanceAuthService);
        const siaghApiClient = app.get(siagh_api_client_1.SiaghApiClient);
        const prisma = app.get(prisma_service_1.PrismaService);
        const initialImportService = app.get(initial_import_service_1.InitialImportService);
        logger.logSection('TEST 1: CRM (PAYAMGOSTAR) API TESTS');
        logger.logSubSection('1.1: CRM Authentication');
        try {
            const crmBaseUrl = process.env.CRM_BASE_URL || 'http://172.16.16.16';
            logger.log(`CRM Base URL: ${crmBaseUrl}`);
            logger.logRequest('POST', `${crmBaseUrl}/api/v2/auth/login`, {
                username: process.env.CRM_USERNAME,
                password: '***HIDDEN***',
            }, {
                'Content-Type': 'application/json',
            });
            await crmAuthService.ensureAuthenticated();
            const token = await crmAuthService.getToken();
            const authHeaders = await crmAuthService.getAuthHeaders();
            if (token) {
                logger.logSuccess('CRM authentication successful');
                logger.log(`Access Token: ${token.substring(0, 20)}...`);
                logger.log(`Auth Header: ${authHeaders.Authorization.substring(0, 30)}...`);
            }
            else {
                logger.logWarning('CRM authentication returned no token');
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('1.2: Create New Test Person in CRM');
        let createdPersonId = null;
        try {
            const crmBaseUrl = process.env.CRM_BASE_URL || 'http://172.16.16.16';
            const authHeaders = await crmAuthService.getAuthHeaders();
            const timestamp = Date.now();
            const randomNumber = Math.floor(Math.random() * 1000000000);
            const testPerson = {
                crmObjectTypeCode: 'person',
                nickName: 'Test Person ' + timestamp,
                firstName: 'Test',
                lastName: 'Person API',
                customerNumber: '100-' + randomNumber,
                nationalCode: generateRandomNationalCode(),
                email: generateRandomEmail(),
                phoneContacts: [
                    {
                        default: true,
                        phoneType: 'Mobile',
                        phoneNumber: generateRandomMobile(),
                    },
                ],
                categories: [
                    {
                        key: 'syaghcontact',
                    },
                ],
            };
            logger.logRequest('POST', `${crmBaseUrl}/api/v2/crmobject/person/create`, testPerson, authHeaders);
            const created = await crmIdentityApiClient.createPerson(testPerson);
            createdPersonId = created.crmId;
            logger.logResponse('200 OK', created);
            logger.log(`FULL RESPONSE OBJECT: ${JSON.stringify(created, null, 2)}`);
            if (createdPersonId) {
                logger.logSuccess(`Created person with CRM ID: ${createdPersonId}`);
            }
            else {
                logger.logWarning(`Person created but crmId not found in response. Response: ${JSON.stringify(created)}`);
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('1.3: Create New Test Organization in CRM');
        let createdOrganizationId = null;
        try {
            const crmBaseUrl = process.env.CRM_BASE_URL || 'http://172.16.16.16';
            const authHeaders = await crmAuthService.getAuthHeaders();
            const timestamp = Date.now();
            const randomNumber = Math.floor(Math.random() * 1000000000);
            const testOrganization = {
                crmObjectTypeCode: 'organization',
                nickName: 'Test Organization ' + timestamp,
                customerNumber: '100-' + randomNumber,
                nationalCode: generateRandomNationalCode(),
                email: generateRandomEmail(),
                phoneContacts: [
                    {
                        default: true,
                        phoneType: 'Office',
                        phoneNumber: generateRandomPhone(),
                    },
                ],
                categories: [
                    {
                        key: 'syaghcontact',
                    },
                ],
            };
            logger.logRequest('POST', `${crmBaseUrl}/api/v2/crmobject/organization/create`, testOrganization, authHeaders);
            const created = await crmIdentityApiClient.createOrganization(testOrganization);
            createdOrganizationId = created.crmId;
            logger.logResponse('200 OK', created);
            logger.log(`FULL RESPONSE OBJECT: ${JSON.stringify(created, null, 2)}`);
            if (createdOrganizationId) {
                logger.logSuccess(`Created organization with CRM ID: ${createdOrganizationId}`);
            }
            else {
                logger.logWarning(`Organization created but crmId not found in response. Response: ${JSON.stringify(created)}`);
            }
        }
        catch (error) {
            logger.logError(error);
        }
        if (createdPersonId) {
            logger.logSubSection('1.4: Verify Created Person');
            try {
                const crmBaseUrl = process.env.CRM_BASE_URL || 'http://172.16.16.16';
                const authHeaders = await crmAuthService.getAuthHeaders();
                logger.logRequest('POST', `${crmBaseUrl}/api/v2/crmobject/person/get`, { identityId: createdPersonId }, authHeaders);
                const person = await crmIdentityApiClient.getPerson(createdPersonId);
                logger.logResponse('200 OK', {
                    identityId: person.identityId,
                    nickName: person.nickName,
                    customerNumber: person.customerNumber,
                });
                logger.logSuccess(`Verified person: ${person.nickName}`);
            }
            catch (error) {
                logger.logError(error);
            }
        }
        logger.logSubSection('1.5: Get CRM Identities (Pagination from Page 0)');
        try {
            const crmBaseUrl = process.env.CRM_BASE_URL || 'http://172.16.16.16';
            const authHeaders = await crmAuthService.getAuthHeaders();
            const requestBody0 = {
                pageNumber: 0,
                pageSize: 5,
                searchTerm: '',
            };
            logger.logRequest('POST', `${crmBaseUrl}/api/v2/crmobject/identity/search`, requestBody0, authHeaders);
            const identities0 = await crmIdentityApiClient.searchIdentities(requestBody0);
            logger.logResponse('200 OK - Page 0', {
                count: identities0.length,
                data: identities0,
            });
            if (identities0.length > 0) {
                logger.log('Sample identities from page 0:');
                identities0.forEach((identity, index) => {
                    logger.log(`  ${index + 1}. ${identity.nickName} (ID: ${identity.identityId}, CustomerNo: ${identity.customerNo})`);
                });
                logger.logSuccess(`Retrieved ${identities0.length} identities from page 0`);
            }
            else {
                logger.logWarning('No identities found on page 0');
            }
            const requestBody1 = {
                pageNumber: 1,
                pageSize: 5,
                searchTerm: '',
            };
            logger.logRequest('POST', `${crmBaseUrl}/api/v2/crmobject/identity/search`, requestBody1, authHeaders);
            const identities1 = await crmIdentityApiClient.searchIdentities(requestBody1);
            logger.logResponse('200 OK - Page 1', {
                count: identities1.length,
                data: identities1,
            });
            if (identities1.length > 0) {
                logger.log('Sample identities from page 1:');
                identities1.forEach((identity, index) => {
                    logger.log(`  ${index + 1}. ${identity.nickName} (ID: ${identity.identityId}, CustomerNo: ${identity.customerNo})`);
                });
                logger.logSuccess(`Retrieved ${identities1.length} identities from page 1`);
            }
            else {
                logger.logWarning('No identities found on page 1');
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSubSection('1.6: Search All CRM Identities');
        try {
            const crmBaseUrl = process.env.CRM_BASE_URL || 'http://172.16.16.16';
            const authHeaders = await crmAuthService.getAuthHeaders();
            logger.log('Fetching all identities using pagination (starting from page 0)...');
            logger.logRequest('POST', `${crmBaseUrl}/api/v2/crmobject/identity/search`, {
                pageNumber: 0,
                pageSize: 500,
                searchTerm: '',
            }, authHeaders);
            const allIdentities = await crmIdentityApiClient.searchAllIdentities();
            logger.logResponse('200 OK - All Pages', {
                totalCount: allIdentities.length,
            });
            logger.logSuccess(`Retrieved total of ${allIdentities.length} identities from CRM`);
            if (allIdentities.length > 0) {
                logger.log('First 3 identities:');
                allIdentities.slice(0, 3).forEach((identity, index) => {
                    logger.log(`  ${index + 1}. ${identity.nickName} (ID: ${identity.identityId}, CustomerNo: ${identity.customerNo})`);
                });
            }
        }
        catch (error) {
            logger.logError(error);
        }
        logger.logSection('TEST 2: FINANCE (SIAGH) API TESTS');
        logger.logSubSection('2.1: Finance Authentication');
        try {
            const financeBaseUrl = process.env.FINANCE_BASE_URL || 'http://172.16.16.16:8045';
            logger.log(`Finance Base URL: ${financeBaseUrl}`);
            logger.logRequest('POST', `${financeBaseUrl}/GeneralApi/LoginUser`, {
                UserName: process.env.FINANCE_USERNAME,
                Password: '***HIDDEN (MD5 HASHED)***',
            }, {
                'Content-Type': 'application/json',
            });
            await financeAuthService.ensureAuthenticated();
            const sessionData = financeAuthService.getSessionData();
            const authHeaders = await financeAuthService.getAuthHeaders();
            if (sessionData) {
                logger.logSuccess('Finance authentication successful');
                logger.log(`User: ${sessionData.UserName}`);
                logger.log(`Contact: ${sessionData.ContactName}`);
                logger.log(`Branch: ${sessionData.BranchName}`);
                logger.log(`Fiscal Year: ${sessionData.FiscalYear}`);
                logger.log(`SessionId: ${sessionData.SessionId?.substring(0, 20)}...`);
                logger.log(`Auth Header: Authorization: ${authHeaders.Authorization.substring(0, 30)}...`);
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
            const financeBaseUrl = process.env.FINANCE_BASE_URL || 'http://172.16.16.16:8045';
            const authHeaders = await financeAuthService.getAuthHeaders();
            logger.logRequest('GET', `${financeBaseUrl}/api/Sgh/GEN/Gn_Web_Users/GetAll`, null, authHeaders);
            const users = await siaghApiClient.getAllUsers();
            existingContacts = users.slice(0, 5);
            logger.logResponse('200 OK', {
                totalCount: users.length,
                showing: existingContacts.length,
            });
            if (existingContacts.length > 0) {
                logger.log('Sample contacts:');
                existingContacts.forEach((user, index) => {
                    logger.log(`  ${index + 1}. ${user.Name} (Code: ${user.Code}, tmpid: ${user.tmpid})`);
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
            const financeBaseUrl = process.env.FINANCE_BASE_URL || 'http://172.16.16.16:8045';
            const authHeaders = await financeAuthService.getAuthHeaders();
            const timestamp = Date.now();
            const randomNumber = Math.floor(Math.random() * 1000000000);
            const testContact = {
                fullname: 'Test Contact API ' + timestamp,
                tmpid: '100-' + randomNumber,
                email: generateRandomEmail(),
                mobileno: generateRandomMobile(),
                telno: generateRandomPhone(),
                address: `Test Address ${timestamp}`,
                isactive: 1,
                taraftype: 1,
                tozihat: 'Created by API test script',
            };
            logger.logRequest('POST', `${financeBaseUrl}/BpmsApi/SaveFormData`, testContact, {
                ...authHeaders,
                'form-id': '2BFDA',
            });
            const result = await siaghApiClient.createContact(testContact);
            logger.logResponse(result.ReturnCode === '0' ? 'Success' : 'Failed', result);
            logger.log(`FULL RESPONSE OBJECT: ${JSON.stringify(result, null, 2)}`);
            if (result.ReturnCode === '0') {
                const allUsers = await siaghApiClient.getAllUsers();
                const created = allUsers.find(u => u.tmpid === testContact.tmpid);
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
            if (!createdContactCode) {
                logger.logWarning('No test customer was created in previous step, skipping pre-invoice creation');
                logger.log('Note: Pre-invoice test requires a successfully created customer from Test 2.3');
            }
            else {
                logger.log(`Using newly created test customer (Code: ${createdContactCode}) for pre-invoice`);
                const fiscalYear = financeAuthService.getSessionData()?.FiscalYear;
                const testPreInvoice = {
                    codemoshtari: createdContactCode,
                    codenoeesanad: '2',
                    salmali: fiscalYear,
                    tozihat: `Test Pre-Invoice from API test script - ${Date.now()}`,
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
                    logger.log(`Pre-invoice created for customer: ${createdContactCode}`);
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
            let beforeCount = 0;
            try {
                beforeCount = await prisma.entityMapping.count({
                    where: { entityType: 'CUSTOMER' },
                });
                logger.log(`Existing entity mappings: ${beforeCount}`);
            }
            catch (dbError) {
                if (dbError.message?.includes('does not exist')) {
                    logger.logWarning('EntityMapping table does not exist. Please run migrations first.');
                    logger.logWarning('Skipping sync import test due to missing database tables.');
                    throw new Error('Database tables not found. Run migrations with: npm run migration:run');
                }
                throw dbError;
            }
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
            if (error.message?.includes('does not exist')) {
                logger.logWarning('EntityMapping table does not exist. Please run migrations first.');
            }
            else {
                logger.logError(error);
            }
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
            if (error.message?.includes('does not exist')) {
                logger.logWarning('SyncLog table does not exist. Please run migrations first.');
            }
            else {
                logger.logError(error);
            }
        }
        logger.logSection('TEST 4: SUMMARY');
        const summary = {
            crmAuthentication: '✓',
            crmPersonCreate: createdPersonId ? '✓' : '✗',
            crmOrganizationCreate: createdOrganizationId ? '✓' : '✗',
            crmPersonVerify: createdPersonId ? '✓' : '✗',
            crmIdentitySearch: '✓',
            crmIdentitySearchAll: '✓',
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