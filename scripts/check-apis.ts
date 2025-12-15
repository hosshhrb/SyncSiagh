/**
 * API Connectivity Check Script
 * 
 * Verifies connectivity to CRM and Finance APIs
 * Usage: npx ts-node scripts/check-apis.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CrmApiClient } from '../src/crm/crm-api.client';
import { CrmAuthService } from '../src/crm/crm-auth.service';
import { FinanceApiClient } from '../src/finance/finance-api.client';
import { FinanceAuthService } from '../src/finance/finance-auth.service';
import * as fs from 'fs';

async function bootstrap() {
  console.log('🔍 Checking API connectivity...\n');

  // Check if .env exists
  if (!fs.existsSync('.env')) {
    console.error('❌ Error: .env file not found!');
    console.error('   Please copy .env.example to .env and configure it:');
    console.error('   cp .env.example .env');
    console.error('   nano .env  # Edit with your credentials\n');
    process.exit(1);
  }

  // Load environment variables
  require('dotenv').config();

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL not found in .env file!');
    console.error('   Please set DATABASE_URL in your .env file\n');
    process.exit(1);
  }

  // Check if Redis is running (optional for API check, but warn if missing)
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
  } catch (error) {
    console.warn('⚠️  Warning: Redis is not running. Some features may not work.');
    console.warn('   Start Redis with: docker-compose up -d redis');
    console.warn('   Or: docker run -d -p 6379:6379 redis\n');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // Reduce log noise
  });

  // Get services
  const crmAuthService = app.get(CrmAuthService);
  const crmApiClient = app.get(CrmApiClient);
  const financeAuthService = app.get(FinanceAuthService);
  const financeApiClient = app.get(FinanceApiClient);

  // Check CRM
  console.log('📡 Testing CRM API...');
  try {
    const token = await crmAuthService.getToken();
    console.log(`   ✅ CRM token configured: ${token.substring(0, 10)}...`);

    // Test fetching customers
    console.log('   Fetching customers...');
    const customers = await crmApiClient.getCustomers(1, 5);
    console.log(`   ✅ Successfully fetched ${customers.data?.length || 0} customers`);

    // Check webhook support
    console.log('   Checking webhook support...');
    const hasWebhooks = await crmApiClient.checkWebhookSupport();
    console.log(`   ${hasWebhooks ? '✅' : '⚠️'} Webhooks ${hasWebhooks ? 'supported' : 'may not be supported'}`);
  } catch (error) {
    console.error(`   ❌ CRM API Error: ${error.message}`);
  }

  console.log('');

  // Check Finance
  console.log('📡 Testing Finance API...');
  try {
    console.log('   Authenticating...');
    const sessionId = await financeAuthService.getSessionId();
    console.log(`   ✅ Finance session obtained: ${sessionId.substring(0, 10)}...`);

    // Test fetching customers
    console.log('   Fetching customers...');
    const customers = await financeApiClient.getCustomers(1, 5);
    console.log(`   ✅ Successfully fetched ${customers.data?.length || 0} customers`);
  } catch (error) {
    console.error(`   ❌ Finance API Error: ${error.message}`);
  }

  console.log('\n✅ API connectivity check completed!');

  await app.close();
}

bootstrap();

