"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const initial_import_service_1 = require("../src/sync/orchestrator/initial-import.service");
async function bootstrap() {
    console.log('🚀 Starting SiaghSync test...\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    const importService = app.get(initial_import_service_1.InitialImportService);
    try {
        console.log('📝 Test: Initial Import (Siagh → CRM)');
        console.log('   This will import identities from Finance to CRM\n');
        const result = await importService.runInitialImport();
        console.log('\n📊 Import Result:');
        console.log(`   Total: ${result.total}`);
        console.log(`   Imported: ${result.imported}`);
        console.log(`   Skipped: ${result.skipped}`);
        console.log(`   Errors: ${result.errors}`);
        console.log('\n✅ Test completed!');
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