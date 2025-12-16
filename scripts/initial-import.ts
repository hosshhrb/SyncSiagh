/**
 * Initial Import Script
 * 
 * Imports identities from Siagh Finance to CRM (Payamgostar)
 * 
 * Algorithm:
 * 1. Login to both systems
 * 2. Fetch all users from Siagh (parallel)
 * 3. Fetch all identities from CRM (parallel)
 * 4. Compare using RecordId as unique key
 * 5. Import new records (Person or Organization based on TowardType)
 * 6. Store mappings for future sync
 * 
 * Usage: npm run initial-import
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { InitialImportService } from '../src/sync/orchestrator/initial-import.service';
import * as fs from 'fs';

async function bootstrap() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║   SIAGH SYNC - Initial Import                                 ║');
  console.log('║   Finance (Siagh) → CRM (Payamgostar)                         ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Check if .env exists
  if (!fs.existsSync('.env')) {
    console.error('❌ Error: .env file not found!');
    console.error('   Please ensure .env file exists with correct credentials.');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting application context...');
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    console.log('');
    const importService = app.get(InitialImportService);
    
    // Run the import
    const result = await importService.runInitialImport();

    // Save detailed report
    const reportPath = `import-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    await app.close();
    
    // Exit with appropriate code
    if (result.errors > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ IMPORT FAILED');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error(error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

bootstrap();
