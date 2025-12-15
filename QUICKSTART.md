# SiaghSync - Quick Start

Get up and running in 5 minutes.

## 🚀 Fast Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API credentials

# 3. Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# 4. Setup database
npm run prisma:generate
npm run prisma:migrate

# 5. Test API connectivity
npm run check-apis

# 6. Start application
npm run start:dev
```

## 🔑 Required Configuration

Edit `.env` file:

```bash
# CRM (Payamgostar)
CRM_API_TOKEN="your-crm-token-here"

# Finance System
FINANCE_API_BASE_URL="https://your-finance-api.com"
FINANCE_USERNAME="your-username"
FINANCE_PASSWORD="your-password"
```

## 📡 Verify Setup

### Check Health
```bash
curl http://localhost:3000/health
```

### Check API Connectivity
```bash
npm run check-apis
```

### View Database
```bash
npm run prisma:studio
```

### Send Test Webhook
```bash
curl -X POST http://localhost:3000/webhook/crm \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: test" \
  -d '{
    "eventId": "test-1",
    "eventType": "customer.updated",
    "entityType": "CUSTOMER",
    "entityId": "123",
    "timestamp": "2024-01-15T12:00:00Z"
  }'
```

## 🎯 What Happens Next?

1. **Polling starts** - Every 5 minutes, checks CRM and Finance for changes
2. **Webhooks ready** - Endpoint at `/webhook/crm` accepts events
3. **Auto-sync** - Changes detected in either system sync to the other
4. **Logs everything** - Check `SyncLog` table in Prisma Studio

## 📊 Monitor Syncs

Watch the logs:
```bash
npm run start:dev
```

You'll see:
```
🔄 Polling CRM for customer changes...
Found 3 updated customers in CRM
✅ Queued 3 customers for sync
🔄 Starting sync: CRM -> Finance | Customer abc-123
✅ Successfully created Finance customer xyz-789
```

## 🐛 Troubleshooting

**Can't connect to database?**
```bash
docker-compose restart postgres
```

**Can't connect to CRM/Finance?**
- Check your API credentials in `.env`
- Run `npm run check-apis` for detailed diagnostics

**Sync not working?**
- Open Prisma Studio: `npm run prisma:studio`
- Check `SyncLog` table for errors
- Look for error messages and stack traces

## 📚 Next Steps

- Read [SETUP.md](SETUP.md) for detailed configuration
- Read [IMPLEMENTATION.md](IMPLEMENTATION.md) for architecture details
- Check [README.md](README.md) for project overview

## 💡 Key Commands

```bash
npm run start:dev          # Start with hot reload
npm run check-apis         # Test API connectivity
npm run test-sync          # Manual sync test
npm run prisma:studio      # Open database UI
npm run prisma:migrate     # Run new migrations
docker-compose logs -f     # View infrastructure logs
```

---

**Ready to sync!** 🚀

The engine will automatically:
- ✅ Poll for changes every 5 minutes
- ✅ Detect conflicts and resolve them
- ✅ Prevent infinite loops
- ✅ Retry failed syncs
- ✅ Log everything for audit

Just keep it running and watch the sync magic happen! ✨

