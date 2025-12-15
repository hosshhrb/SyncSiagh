"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const crm_api_client_1 = require("../src/crm/crm-api.client");
const crm_auth_service_1 = require("../src/crm/crm-auth.service");
const finance_api_client_1 = require("../src/finance/finance-api.client");
const finance_auth_service_1 = require("../src/finance/finance-auth.service");
async function bootstrap() {
    console.log('🔍 Checking API connectivity...\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const crmAuthService = app.get(crm_auth_service_1.CrmAuthService);
    const crmApiClient = app.get(crm_api_client_1.CrmApiClient);
    const financeAuthService = app.get(finance_auth_service_1.FinanceAuthService);
    const financeApiClient = app.get(finance_api_client_1.FinanceApiClient);
    console.log('📡 Testing CRM API...');
    try {
        const token = await crmAuthService.getToken();
        console.log(`   ✅ CRM token configured: ${token.substring(0, 10)}...`);
        console.log('   Fetching customers...');
        const customers = await crmApiClient.getCustomers(1, 5);
        console.log(`   ✅ Successfully fetched ${customers.data?.length || 0} customers`);
        console.log('   Checking webhook support...');
        const hasWebhooks = await crmApiClient.checkWebhookSupport();
        console.log(`   ${hasWebhooks ? '✅' : '⚠️'} Webhooks ${hasWebhooks ? 'supported' : 'may not be supported'}`);
    }
    catch (error) {
        console.error(`   ❌ CRM API Error: ${error.message}`);
    }
    console.log('');
    console.log('📡 Testing Finance API...');
    try {
        console.log('   Authenticating...');
        const sessionId = await financeAuthService.getSessionId();
        console.log(`   ✅ Finance session obtained: ${sessionId.substring(0, 10)}...`);
        console.log('   Fetching customers...');
        const customers = await financeApiClient.getCustomers(1, 5);
        console.log(`   ✅ Successfully fetched ${customers.data?.length || 0} customers`);
    }
    catch (error) {
        console.error(`   ❌ Finance API Error: ${error.message}`);
    }
    console.log('\n✅ API connectivity check completed!');
    await app.close();
}
bootstrap();
//# sourceMappingURL=check-apis.js.map