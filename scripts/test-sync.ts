/**
 * Test Script for SiaghSync
 * 
 * This script tests the initial import from Siagh to CRM
 * Usage: npm run test-sync
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { InitialImportService } from '../src/sync/orchestrator/initial-import.service';

async function bootstrap() {
  console.log('🚀 Starting SiaghSync test...\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Get import service
  const importService = app.get(InitialImportService);

  try {
    console.log('📝 Test: Initial Import (Siagh → CRM)');
    console.log('   This will import identities from Finance to CRM\n');

    // Run the import
    const result = await importService.runInitialImport();

    console.log('\n📊 Import Result:');
    console.log(`   Total: ${result.total}`);
    console.log(`   Imported: ${result.imported}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Errors: ${result.errors}`);

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

bootstrap();
