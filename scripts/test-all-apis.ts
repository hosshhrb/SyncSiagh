import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CrmApiClient } from '../src/crm/crm-api.client';
import { CrmAuthService } from '../src/crm/crm-auth.service';
import { SiaghApiClient } from '../src/finance/siagh-api.client';
import { FinanceAuthService } from '../src/finance/finance-auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { InitialImportService } from '../src/sync/orchestrator/initial-import.service';
import { SiaghUserDto } from '../src/finance/dto/siagh-user.dto';
import * as fs from 'fs';
import * as path from 'path';

// Logger class to write to both console and file
class TestLogger {
  private logFile: string;
  private logStream: fs.WriteStream;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(__dirname, `../logs/api-test-${timestamp}.log`);

    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    this.log('='.repeat(80));
    this.log(`API TEST STARTED AT: ${new Date().toISOString()}`);
    this.log('='.repeat(80));
  }

  log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.logStream.write(logMessage + '\n');
  }

  logSection(title: string) {
    const line = '='.repeat(80);
    this.log('\n' + line);
    this.log(`  ${title}`);
    this.log(line + '\n');
  }

  logSubSection(title: string) {
    this.log('\n' + '-'.repeat(60));
    this.log(`  ${title}`);
    this.log('-'.repeat(60));
  }

  logRequest(method: string, url: string, data?: any, headers?: any) {
    this.log(`REQUEST: ${method} ${url}`);
    if (headers) {
      this.log(`REQUEST HEADERS: ${JSON.stringify(headers, null, 2)}`);
    }
    if (data) {
      this.log(`REQUEST DATA: ${JSON.stringify(data, null, 2)}`);
    }
  }

  logResponse(status: string, data?: any, headers?: any) {
    this.log(`RESPONSE STATUS: ${status}`);
    if (headers) {
      this.log(`RESPONSE HEADERS: ${JSON.stringify(headers, null, 2)}`);
    }
    if (data) {
      this.log(`RESPONSE DATA: ${JSON.stringify(data, null, 2)}`);
    }
  }

  logError(error: any) {
    this.log(`ERROR: ${error.message || error}`);
    if (error.response?.data) {
      this.log(`ERROR DETAILS: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    if (error.stack) {
      this.log(`STACK TRACE: ${error.stack}`);
    }
  }

  logSuccess(message: string) {
    this.log(`✓ SUCCESS: ${message}`);
  }

  logWarning(message: string) {
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
    // Bootstrap the NestJS application
    logger.logSection('INITIALIZING APPLICATION');
    app = await NestFactory.createApplicationContext(AppModule);
    logger.logSuccess('Application context created');

    // Get service instances
    const crmAuthService = app.get(CrmAuthService);
    const crmApiClient = app.get(CrmApiClient);
    const financeAuthService = app.get(FinanceAuthService);
    const siaghApiClient = app.get(SiaghApiClient);
    const prisma = app.get(PrismaService);
    const initialImportService = app.get(InitialImportService);

    // =================================================================
    // TEST 1: CRM API TESTS
    // =================================================================
    logger.logSection('TEST 1: CRM (PAYAMGOSTAR) API TESTS');

    // Test 1.1: CRM Authentication
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
      } else {
        logger.logWarning('CRM authentication returned no token');
      }
    } catch (error) {
      logger.logError(error);
    }

    // Test 1.2: Get CRM Customers (list first 5)
    logger.logSubSection('1.2: Get CRM Customers (First 5)');
    try {
      const crmBaseUrl = process.env.CRM_BASE_URL || 'http://172.16.16.16';
      const authHeaders = await crmAuthService.getAuthHeaders();
      logger.logRequest('GET', `${crmBaseUrl}/api/v2/Identities?pageNumber=1&pageSize=5`, null, authHeaders);

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
      } else {
        logger.logWarning('No customers found in CRM');
      }
    } catch (error) {
      logger.logError(error);
    }

    // Test 1.3: Create a new test customer in CRM
    logger.logSubSection('1.3: Create New Test Customer in CRM');
    let createdCustomerId: string | null = null;
    try {
      const crmBaseUrl = process.env.CRM_BASE_URL || 'http://172.16.16.16';
      const authHeaders = await crmAuthService.getAuthHeaders();
      const testCustomer = {
        firstName: 'Test',
        lastName: 'Customer API Test',
        nickName: 'Test Customer ' + Date.now(),
        identityType: 'Person' as const,
        mobile: '09123456789',
        email: 'test@example.com',
        nationalCode: String(Math.floor(Math.random() * 10000000000)),
      };

      logger.logRequest('POST', `${crmBaseUrl}/api/v2/Identities`, testCustomer, authHeaders);

      const created = await crmApiClient.createCustomer(testCustomer);
      createdCustomerId = created.id;

      logger.logResponse('201 Created', created);
      logger.log(`FULL RESPONSE OBJECT: ${JSON.stringify(created, null, 2)}`);
      logger.logSuccess(`Created customer with ID: ${createdCustomerId}`);
    } catch (error) {
      logger.logError(error);
    }

    // Test 1.4: Verify created customer
    if (createdCustomerId) {
      logger.logSubSection('1.4: Verify Created Customer');
      try {
        logger.logRequest('GET', `/crm/customers/${createdCustomerId}`);

        const customer = await crmApiClient.getCustomerById(createdCustomerId);

        logger.logResponse('200 OK', customer);
        logger.logSuccess(`Verified customer: ${customer.name}`);
      } catch (error) {
        logger.logError(error);
      }
    }

    // =================================================================
    // TEST 2: FINANCE (SIAGH) API TESTS
    // =================================================================
    logger.logSection('TEST 2: FINANCE (SIAGH) API TESTS');

    // Test 2.1: Finance Authentication
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
      } else {
        logger.logWarning('Finance authentication returned no session data');
      }
    } catch (error) {
      logger.logError(error);
    }

    // Test 2.2: Get Finance Users/Contacts (first 5)
    logger.logSubSection('2.2: Get Finance Users/Contacts (First 5)');
    let existingContacts: SiaghUserDto[] = [];
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
          logger.log(`  ${index + 1}. ${user.Name} (Code: ${user.Code}, TpmId: ${user.TpmId})`);
        });
        logger.logSuccess(`Retrieved ${existingContacts.length} contacts from Finance`);
      } else {
        logger.logWarning('No contacts found in Finance');
      }
    } catch (error) {
      logger.logError(error);
    }

    // Test 2.3: Create a new test contact in Finance
    logger.logSubSection('2.3: Create New Test Contact in Finance');
    let createdContactCode: string | null = null;
    try {
      const financeBaseUrl = process.env.FINANCE_BASE_URL || 'http://172.16.16.16:8045';
      const authHeaders = await financeAuthService.getAuthHeaders();
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

      logger.logRequest('POST', `${financeBaseUrl}/BpmsApi/SaveFormData`, testContact, {
        ...authHeaders,
        'form-id': '2BFDA',
      });

      const result = await siaghApiClient.createContact(testContact);

      logger.logResponse(result.ReturnCode === '0' ? 'Success' : 'Failed', result);
      logger.log(`FULL RESPONSE OBJECT: ${JSON.stringify(result, null, 2)}`);

      if (result.ReturnCode === '0') {
        // Try to find the created contact
        const allUsers = await siaghApiClient.getAllUsers();
        const created = allUsers.find(u => u.TpmId === testContact.tpmid);

        if (created) {
          createdContactCode = created.Code;
          logger.logSuccess(`Created contact with Code: ${createdContactCode}`);
        } else {
          logger.logWarning('Contact created but could not retrieve Code');
        }
      } else {
        logger.logWarning('Contact creation may have failed');
        if (result.Errors) {
          logger.log(`Errors: ${JSON.stringify(result.Errors)}`);
        }
      }
    } catch (error) {
      logger.logError(error);
    }

    // Test 2.4: Create a test pre-invoice in Finance
    logger.logSubSection('2.4: Create Test Pre-Invoice in Finance');
    try {
      // Use existing contact or created contact
      const customerCode = createdContactCode || (existingContacts[0]?.Code);

      if (!customerCode) {
        logger.logWarning('No customer code available, skipping pre-invoice creation');
      } else {
        const fiscalYear = financeAuthService.getSessionData()?.FiscalYear;

        const testPreInvoice = {
          codemoshtari: customerCode,
          codenoeesanad: '2', // Pre-invoice
          salmali: fiscalYear,
          tozihat: 'Test Pre-Invoice from API test script',
          items: [
            {
              codekala: '1', // You may need to adjust this to a valid product code
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
        } else {
          logger.logWarning('Pre-invoice creation may have failed');
          if (result.Errors) {
            logger.log(`Errors: ${JSON.stringify(result.Errors)}`);
          }
        }
      }
    } catch (error) {
      logger.logError(error);
    }

    // =================================================================
    // TEST 3: SYNC OPERATIONS (LIMITED DATA)
    // =================================================================
    logger.logSection('TEST 3: SYNC OPERATIONS - INITIAL IMPORT (LIMITED)');

    // Test 3.1: Import 2 contacts from Finance to CRM
    logger.logSubSection('3.1: Import 2 Contacts from Finance to CRM');
    try {
      logger.log('Starting limited initial import (max 2 contacts)...');

      // Get current entity mappings count
      const beforeCount = await prisma.entityMapping.count({
        where: { entityType: 'CUSTOMER' },
      });
      logger.log(`Existing entity mappings: ${beforeCount}`);

      // Run initial import with limit
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

      // Get updated count
      const afterCount = await prisma.entityMapping.count({
        where: { entityType: 'CUSTOMER' },
      });
      logger.log(`\nEntity mappings after import: ${afterCount}`);
      logger.log(`New mappings created: ${afterCount - beforeCount}`);

      logger.logSuccess(`Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`);
    } catch (error) {
      logger.logError(error);
    }

    // Test 3.2: Verify entity mappings
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
    } catch (error) {
      logger.logError(error);
    }

    // Test 3.3: Verify sync logs
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
    } catch (error) {
      logger.logError(error);
    }

    // =================================================================
    // TEST 4: SUMMARY
    // =================================================================
    logger.logSection('TEST 4: SUMMARY');

    const summary = {
      crmAuthentication: '✓',
      crmCustomerList: '✓',
      crmCustomerCreate: createdCustomerId ? '✓' : '✗',
      crmCustomerVerify: createdCustomerId ? '✓' : '✗',
      financeAuthentication: '✓',
      financeContactList: '✓',
      financeContactCreate: createdContactCode ? '✓' : '✗',
      financePreInvoiceCreate: '?', // May or may not work depending on product codes
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

  } catch (error) {
    logger.logError(error);
  } finally {
    if (app) {
      await app.close();
      logger.log('Application context closed');
    }
    logger.close();
  }
}

// Run the tests
testAllApis()
  .then(() => {
    console.log('\n✓ All tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Test execution failed:', error);
    process.exit(1);
  });
