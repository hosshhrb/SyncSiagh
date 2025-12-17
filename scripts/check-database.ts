#!/usr/bin/env ts-node
/**
 * Database Connection & Query Test
 *
 * Tests database connectivity and shows recent activity
 * Usage: npx ts-node scripts/check-database.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkDatabase() {
  console.log('🔍 Checking database connection...\n');

  try {
    // Test connection
    console.log('1️⃣ Testing connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to database\n');

    // Show database info
    console.log('2️⃣ Database Information:');
    const result = await prisma.$queryRaw`
      SELECT
        current_database() as database_name,
        current_user as user_name,
        version() as postgres_version
    `;
    console.log(result);
    console.log('');

    // Count records in each table
    console.log('3️⃣ Table Statistics:');

    const entityMappingCount = await prisma.entityMapping.count();
    console.log(`   📊 EntityMapping: ${entityMappingCount} records`);

    const syncLogCount = await prisma.syncLog.count();
    console.log(`   📊 SyncLog: ${syncLogCount} records`);

    const webhookSubCount = await prisma.webhookSubscription.count();
    console.log(`   📊 WebhookSubscription: ${webhookSubCount} records`);

    console.log('');

    // Recent sync activity
    console.log('4️⃣ Recent Sync Activity (Last 10):');
    const recentLogs = await prisma.syncLog.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        direction: true,
        triggerType: true,
        startedAt: true,
        durationMs: true,
        errorMessage: true,
      },
    });

    if (recentLogs.length === 0) {
      console.log('   No sync logs yet');
    } else {
      recentLogs.forEach(log => {
        const statusEmoji = {
          SUCCESS: '✅',
          FAILED: '❌',
          PENDING: '⏳',
          IN_PROGRESS: '🔄',
        }[log.status] || '❓';

        console.log(`   ${statusEmoji} ${log.triggerType} - ${log.direction} - ${log.status}`);
        console.log(`      Time: ${log.startedAt.toLocaleString()}`);
        if (log.durationMs) {
          console.log(`      Duration: ${log.durationMs}ms`);
        }
        if (log.errorMessage) {
          console.log(`      Error: ${log.errorMessage}`);
        }
      });
    }

    console.log('');

    // Check for failed syncs
    console.log('5️⃣ Failed Syncs (Last 24h):');
    const failedSyncs = await prisma.syncLog.count({
      where: {
        status: 'FAILED',
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
    console.log(`   ❌ Failed syncs: ${failedSyncs}`);

    // Check for pending syncs
    const pendingSyncs = await prisma.syncLog.count({
      where: {
        status: 'PENDING',
      },
    });
    console.log(`   ⏳ Pending syncs: ${pendingSyncs}`);

    console.log('');

    // Webhook statistics
    console.log('6️⃣ Webhook Statistics (All Time):');
    const webhookStats = await prisma.syncLog.groupBy({
      by: ['status'],
      where: {
        triggerType: 'WEBHOOK',
      },
      _count: {
        status: true,
      },
    });

    if (webhookStats.length === 0) {
      console.log('   No webhooks received yet');
    } else {
      webhookStats.forEach(stat => {
        const emoji = {
          SUCCESS: '✅',
          FAILED: '❌',
          PENDING: '⏳',
          IN_PROGRESS: '🔄',
        }[stat.status] || '❓';
        console.log(`   ${emoji} ${stat.status}: ${stat._count.status} webhooks`);
      });
    }

    console.log('');
    console.log('✅ Database check completed successfully!');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('\nPossible issues:');
    console.error('  - Database not running');
    console.error('  - Wrong DATABASE_URL in .env');
    console.error('  - Network connectivity issue');
    console.error('  - Migrations not run (try: npx prisma migrate deploy)');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
