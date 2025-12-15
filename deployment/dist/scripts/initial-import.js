"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const initial_sync_service_1 = require("../src/sync/orchestrator/initial-sync.service");
async function bootstrap() {
    console.log('🚀 Starting initial import from Finance to CRM...\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const initialSyncService = app.get(initial_sync_service_1.InitialSyncService);
    try {
        const hasCompleted = await initialSyncService.hasInitialImportCompleted();
        if (hasCompleted) {
            console.log('⚠️  Initial import appears to have been completed already.');
            console.log('   Found existing entity mappings from Finance.');
            console.log('');
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            const answer = await new Promise((resolve) => {
                readline.question('   Run import anyway? (yes/no): ', resolve);
            });
            readline.close();
            if (answer.toLowerCase() !== 'yes') {
                console.log('\n❌ Import cancelled.');
                await app.close();
                return;
            }
            console.log('');
        }
        const result = await initialSyncService.importCustomersFromFinance();
        console.log('\n📊 Import Summary:');
        console.log(`   ✅ Imported: ${result.imported} customers`);
        console.log(`   ⏭️  Skipped: ${result.skipped} (already exist)`);
        console.log(`   ❌ Errors: ${result.errors}`);
        console.log('');
        if (result.imported > 0) {
            console.log('✅ Initial import completed successfully!');
            console.log('');
            console.log('📝 Next steps:');
            console.log('   1. Verify imported customers in CRM');
            console.log('   2. Check entity mappings in Prisma Studio: npm run prisma:studio');
            console.log('   3. Start normal sync operation: npm run start:dev');
            console.log('');
        }
        else {
            console.log('ℹ️  No new customers were imported.');
            console.log('   All Finance customers already exist in CRM.');
            console.log('');
        }
    }
    catch (error) {
        console.error('\n❌ Import failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=initial-import.js.map