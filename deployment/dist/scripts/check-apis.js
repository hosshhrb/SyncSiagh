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
const crm_auth_service_1 = require("../src/crm/crm-auth.service");
const finance_api_client_1 = require("../src/finance/finance-api.client");
const finance_auth_service_1 = require("../src/finance/finance-auth.service");
const fs = __importStar(require("fs"));
async function bootstrap() {
    console.log('🔍 Checking API connectivity...\n');
    if (!fs.existsSync('.env')) {
        console.error('❌ Error: .env file not found!');
        console.error('   Please copy .env.example to .env and configure it:');
        console.error('   cp .env.example .env');
        console.error('   nano .env  # Edit with your credentials\n');
        process.exit(1);
    }
    require('dotenv').config();
    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL not found in .env file!');
        console.error('   Please set DATABASE_URL in your .env file\n');
        process.exit(1);
    }
    try {
        const redis = require('redis');
        const client = redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                connectTimeout: 2000,
            }
        });
        await client.connect();
        await client.quit();
    }
    catch (error) {
        console.warn('⚠️  Warning: Redis is not running. Some features may not work.');
        console.warn('   Start Redis with: docker-compose up -d redis');
        console.warn('   Or: docker run -d -p 6379:6379 redis\n');
    }
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['error', 'warn'],
    });
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