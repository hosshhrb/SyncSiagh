/**
 * Test Script for SiaghSync
 * 
 * This script demonstrates how to trigger a sync operation manually
 * Usage: npx ts-node scripts/test-sync.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CustomerSyncService } from '../src/sync/orchestrator/customer-sync.service';

async function bootstrap() {
  console.log('🚀 Starting SiaghSync test...\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get sync service
  const customerSyncService = app.get(CustomerSyncService);

  try {
    // Example: Sync a specific customer from CRM to Finance
    console.log('📝 Test 1: Sync customer from CRM to Finance');
    console.log('   Replace "CUSTOMER_ID_HERE" with actual CRM customer ID\n');

    // Uncomment and provide real customer ID to test:
    // await customerSyncService.syncFromCrmToFinance(
    //   'CUSTOMER_ID_HERE',
    //   'MANUAL',
    // );
    // console.log('✅ Test 1 passed!\n');

    // Example: Sync a specific customer from Finance to CRM
    console.log('📝 Test 2: Sync customer from Finance to CRM');
    console.log('   Replace "CUSTOMER_ID_HERE" with actual Finance customer ID\n');

    // Uncomment and provide real customer ID to test:
    // await customerSyncService.syncFromFinanceToCrm(
    //   'CUSTOMER_ID_HERE',
    //   'MANUAL',
    // );
    // console.log('✅ Test 2 passed!\n');

    console.log('✅ All tests completed!');
    console.log('\nTo run actual tests:');
    console.log('1. Uncomment the test code above');
    console.log('2. Replace CUSTOMER_ID_HERE with real IDs');
    console.log('3. Run: npx ts-node scripts/test-sync.ts\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

bootstrap();

