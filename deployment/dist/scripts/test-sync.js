"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const customer_sync_service_1 = require("../src/sync/orchestrator/customer-sync.service");
async function bootstrap() {
    console.log('🚀 Starting SiaghSync test...\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const customerSyncService = app.get(customer_sync_service_1.CustomerSyncService);
    try {
        console.log('📝 Test 1: Sync customer from CRM to Finance');
        console.log('   Replace "CUSTOMER_ID_HERE" with actual CRM customer ID\n');
        console.log('📝 Test 2: Sync customer from Finance to CRM');
        console.log('   Replace "CUSTOMER_ID_HERE" with actual Finance customer ID\n');
        console.log('✅ All tests completed!');
        console.log('\nTo run actual tests:');
        console.log('1. Uncomment the test code above');
        console.log('2. Replace CUSTOMER_ID_HERE with real IDs');
        console.log('3. Run: npx ts-node scripts/test-sync.ts\n');
    }
    catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=test-sync.js.map