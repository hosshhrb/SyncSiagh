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
const initial_import_service_1 = require("../src/sync/orchestrator/initial-import.service");
const fs = __importStar(require("fs"));
async function bootstrap() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║   SIAGH SYNC - Initial Import                                 ║');
    console.log('║   Finance (Siagh) → CRM (Payamgostar)                         ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    if (!fs.existsSync('.env')) {
        console.error('❌ Error: .env file not found!');
        console.error('   Please ensure .env file exists with correct credentials.');
        process.exit(1);
    }
    try {
        console.log('🚀 Starting application context...');
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
            logger: ['error', 'warn', 'log'],
        });
        console.log('');
        const importService = app.get(initial_import_service_1.InitialImportService);
        const result = await importService.runInitialImport();
        const reportPath = `import-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
        console.log(`📄 Detailed report saved to: ${reportPath}`);
        await app.close();
        if (result.errors > 0) {
            process.exit(1);
        }
        process.exit(0);
    }
    catch (error) {
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
//# sourceMappingURL=initial-import.js.map