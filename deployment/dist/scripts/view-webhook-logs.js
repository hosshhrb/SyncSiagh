#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        count: 20,
        failedOnly: false,
        pendingOnly: false,
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--count' && args[i + 1]) {
            options.count = parseInt(args[i + 1]);
            i++;
        }
        else if (args[i] === '--failed') {
            options.failedOnly = true;
        }
        else if (args[i] === '--pending') {
            options.pendingOnly = true;
        }
        else if (args[i] === '--type' && args[i + 1]) {
            options.entityType = args[i + 1];
            i++;
        }
    }
    return options;
}
async function viewWebhookLogs() {
    console.log('🔍 Fetching webhook logs...\n');
    const options = parseArgs();
    try {
        const where = {
            triggerType: 'WEBHOOK',
        };
        if (options.failedOnly) {
            where.status = 'FAILED';
        }
        else if (options.pendingOnly) {
            where.status = 'PENDING';
        }
        if (options.entityType) {
            where.entityMapping = {
                entityType: options.entityType.toUpperCase(),
            };
        }
        const logs = await prisma.syncLog.findMany({
            where,
            include: {
                entityMapping: true,
            },
            orderBy: {
                startedAt: 'desc',
            },
            take: options.count,
        });
        if (logs.length === 0) {
            console.log('No webhook logs found.');
            return;
        }
        console.log(`Found ${logs.length} webhook events:\n`);
        console.log('═'.repeat(100));
        for (const log of logs) {
            const statusEmoji = {
                PENDING: '⏳',
                IN_PROGRESS: '🔄',
                SUCCESS: '✅',
                FAILED: '❌',
                CONFLICT: '⚠️',
            }[log.status] || '❓';
            const directionArrow = log.direction === 'CRM_TO_FINANCE' ? '→' : '←';
            console.log(`\n${statusEmoji} Webhook Event`);
            console.log(`   ID: ${log.id}`);
            console.log(`   Transaction: ${log.transactionId}`);
            console.log(`   Status: ${log.status}`);
            console.log(`   Direction: ${log.sourceSystem} ${directionArrow} ${log.targetSystem}`);
            console.log(`   Entity Type: ${log.entityMapping.entityType}`);
            console.log(`   Source ID: ${log.sourceEntityId}`);
            if (log.targetEntityId) {
                console.log(`   Target ID: ${log.targetEntityId}`);
            }
            console.log(`   Received: ${log.startedAt.toLocaleString()}`);
            if (log.completedAt) {
                console.log(`   Completed: ${log.completedAt.toLocaleString()}`);
                console.log(`   Duration: ${log.durationMs}ms`);
            }
            if (log.triggerPayload) {
                console.log(`   📦 Webhook Payload:`);
                const payload = log.triggerPayload;
                console.log(`      ${JSON.stringify(payload, null, 6).split('\n').join('\n      ')}`);
            }
            if (log.status === 'FAILED' && log.errorMessage) {
                console.log(`   ❌ Error: ${log.errorMessage}`);
                if (log.retryCount > 0) {
                    console.log(`   🔄 Retries: ${log.retryCount}`);
                }
            }
            console.log('─'.repeat(100));
        }
        console.log('\n📊 Summary:');
        const stats = {
            total: logs.length,
            success: logs.filter(l => l.status === 'SUCCESS').length,
            failed: logs.filter(l => l.status === 'FAILED').length,
            pending: logs.filter(l => l.status === 'PENDING').length,
            inProgress: logs.filter(l => l.status === 'IN_PROGRESS').length,
        };
        console.log(`   Total: ${stats.total}`);
        console.log(`   ✅ Success: ${stats.success}`);
        console.log(`   ❌ Failed: ${stats.failed}`);
        console.log(`   ⏳ Pending: ${stats.pending}`);
        console.log(`   🔄 In Progress: ${stats.inProgress}`);
        const completed = logs.filter(l => l.durationMs !== null);
        if (completed.length > 0) {
            const avgDuration = completed.reduce((sum, l) => sum + (l.durationMs || 0), 0) / completed.length;
            console.log(`   ⏱️  Avg Duration: ${avgDuration.toFixed(0)}ms`);
        }
    }
    catch (error) {
        console.error('❌ Error fetching webhook logs:', error.message);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
📨 Webhook Log Viewer

Usage:
  npx ts-node scripts/view-webhook-logs.ts [options]

Options:
  --count <n>      Number of logs to show (default: 20)
  --failed         Show only failed webhooks
  --pending        Show only pending webhooks
  --type <type>    Filter by entity type (CUSTOMER, PREINVOICE)
  --help           Show this help

Examples:
  npx ts-node scripts/view-webhook-logs.ts
  npx ts-node scripts/view-webhook-logs.ts --count 50
  npx ts-node scripts/view-webhook-logs.ts --failed
  npx ts-node scripts/view-webhook-logs.ts --type CUSTOMER
  `);
    process.exit(0);
}
viewWebhookLogs().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=view-webhook-logs.js.map