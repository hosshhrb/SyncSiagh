# Database Migration Instructions

## Before First Run

The database tables need to be created before running the application or tests.

### On Windows Deployment Machine

1. Open Command Prompt in the `deployment` folder
2. Run the migration script:
   ```batch
   run-migrations.bat
   ```

   OR manually run:
   ```batch
   npx prisma migrate deploy
   ```

This will create all necessary database tables:
- `EntityMapping` - Maps entities between CRM and Finance systems
- `SyncLog` - Logs all sync operations
- `WebhookSubscription` - Tracks webhook subscriptions
- `SyncRetryQueue` - Queue for failed syncs

## Verifying Database Tables

After running migrations, you can verify the tables were created:

```batch
npx prisma studio
```

This will open Prisma Studio in your browser where you can view all tables.

## Migration Files

Migration files are located in `prisma/migrations/` and are automatically applied when running `prisma migrate deploy`.
