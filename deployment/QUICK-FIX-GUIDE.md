# Quick Fix Guide - Database Permission Error

## Your Current Problem

You're seeing this error:
```
ERROR: permission denied for schema public
The table `public.EntityMapping` does not exist in the current database
```

## Immediate Solution (Choose One)

### Option 1: Use the Automated Script (Recommended)

1. **Open Command Prompt or PowerShell in the deployment folder**

2. **Run:**
   ```batch
   run-migrations.bat fix
   ```

3. **Follow the prompts** - It will ask for the postgres password to fix permissions

### Option 2: Manual Fix (If script doesn't work)

1. **Open pgAdmin or psql**

2. **Connect as superuser (postgres)**

3. **Run these SQL commands on `siagh_sync` database:**

```sql
-- Grant all privileges on public schema
GRANT ALL ON SCHEMA public TO siagh_user;
GRANT CREATE ON SCHEMA public TO siagh_user;

-- Grant privileges on existing objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO siagh_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO siagh_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO siagh_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO siagh_user;
```

4. **Then run migrations:**
   ```batch
   npx prisma migrate deploy
   ```

### Option 3: Using psql Command Line

```batch
# Run the SQL script directly
psql -U postgres -d siagh_sync -f fix-db-permissions.sql

# Then run migrations
npx prisma migrate deploy
```

## Verify the Fix

After running the fix, verify it worked:

```batch
# Check migration status
npx prisma migrate status

# Test the application
npm run test-all-apis
```

## What Changed

I've created several new files to help with this issue:

1. **run-migrations.bat** - Easy Windows script to run migrations
2. **run-migrations.ps1** - PowerShell script with permission fixing
3. **fix-db-permissions.sql** - SQL script to fix database permissions
4. **MIGRATION-README.md** - Complete migration troubleshooting guide

## Current Application Status

Your application is running but failing on:
- EntityMapping table access
- SyncLog table access
- Any webhook processing that needs database

Once you fix permissions and run migrations, everything will work!

## After Fix - Restart Application

```batch
# If using PM2
pm2 restart siaghsync

# Or restart manually if running in console
# Press Ctrl+C to stop, then run:
node dist/src/main.js
```

## Still Having Issues?

See **MIGRATION-README.md** for:
- Detailed troubleshooting steps
- Common error messages and solutions
- Database setup checklist
- Alternative fix methods
