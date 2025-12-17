# Database Migration Guide for SiaghSync

## Quick Fix for "permission denied for schema public" Error

If you see this error when running migrations:
```
ERROR: permission denied for schema public
```

**Solution:** Run migrations with permission fix:

### Windows:
```batch
run-migrations.bat fix
```

Or with PowerShell:
```powershell
.\run-migrations.ps1 -FixPermissions
```

### Manual Fix (if scripts don't work):

1. **Open pgAdmin or psql as superuser (postgres)**

2. **Run this SQL** on your `siagh_sync` database:

```sql
-- Grant all privileges on public schema to siagh_user
GRANT ALL ON SCHEMA public TO siagh_user;
GRANT CREATE ON SCHEMA public TO siagh_user;

-- Grant privileges on existing objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO siagh_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO siagh_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO siagh_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO siagh_user;
```

3. **Run migrations again:**
```batch
npx prisma migrate deploy
```

---

## Common Migration Scenarios

### 1. Fresh Installation

When deploying for the first time:

```batch
# 1. Ensure database exists and user has permissions
run-migrations.bat fix

# 2. This will:
#    - Fix database permissions
#    - Generate Prisma client
#    - Run all migrations
```

### 2. Regular Updates

When updating the application with new migrations:

```batch
# Simply run:
run-migrations.bat

# This will apply any pending migrations
```

### 3. Check Migration Status

To see what migrations have been applied:

```batch
npx prisma migrate status
```

### 4. Database Already Has Tables but Migration Fails

If you have tables but migrations fail:

```batch
# Option 1: Fix permissions and retry
run-migrations.bat fix

# Option 2: Reset and reapply (WARNING: This will delete all data!)
npx prisma migrate reset
```

---

## Troubleshooting

### Error: "The table `public.EntityMapping` does not exist"

**Cause:** Migrations haven't been run yet.

**Solution:**
```batch
run-migrations.bat
```

### Error: "permission denied for schema public"

**Cause:** Database user doesn't have CREATE privileges on public schema.

**Solution:**
```batch
run-migrations.bat fix
```

### Error: "database does not exist"

**Cause:** Database hasn't been created.

**Solution:** Create the database first:
```sql
-- Run as postgres superuser
CREATE DATABASE siagh_sync;
GRANT ALL PRIVILEGES ON DATABASE siagh_sync TO siagh_user;
```

Then run migrations:
```batch
run-migrations.bat
```

### Error: "P3009: migrate found failed migrations"

**Cause:** A previous migration failed and needs to be resolved.

**Solution:**
```batch
# Check migration status
npx prisma migrate status

# Option 1: Resolve failed migration
npx prisma migrate resolve --rolled-back "migration_name"

# Option 2: Reset database (WARNING: Deletes all data!)
npx prisma migrate reset
```

---

## Database Setup Checklist

Before running migrations, ensure:

- [ ] PostgreSQL is running
- [ ] Database `siagh_sync` exists
- [ ] User `siagh_user` exists (or your custom user from .env)
- [ ] User has proper permissions (run `fix-db-permissions.sql`)
- [ ] DATABASE_URL in .env is correct
- [ ] You can connect to database with the credentials

---

## Migration Files Location

Migrations are stored in:
```
deployment/prisma/migrations/
```

Each migration folder contains:
- `migration.sql` - The SQL statements to apply
- (Prisma manages migration metadata)

---

## Production Deployment Workflow

1. **Build and copy files to production server**
   ```bash
   npm run build
   # Copy deployment/ folder to server
   ```

2. **On production server, run deployment script**
   ```batch
   .\deploy-windows.ps1
   ```

3. **Fix permissions if needed (first time only)**
   ```batch
   run-migrations.bat fix
   ```

4. **Start application**
   ```batch
   pm2 start dist/src/main.js --name siaghsync
   pm2 save
   ```

---

## Manual Migration Commands

If you need to run commands manually:

### Generate Prisma Client
```batch
npx prisma generate
```

### Apply Migrations (Production)
```batch
npx prisma migrate deploy
```

### Check Migration Status
```batch
npx prisma migrate status
```

### Create New Migration (Development Only)
```batch
npx prisma migrate dev --name descriptive_name
```

### Reset Database (WARNING: Deletes all data!)
```batch
npx prisma migrate reset
```

---

## Database Connection Troubleshooting

### Test Database Connection

Create a test file `test-db.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✓ Database connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
  }
}

test();
```

Run it:
```batch
node test-db.js
```

### Check PostgreSQL Service

```batch
# Check if PostgreSQL is running
sc query postgresql-x64-14

# Start PostgreSQL if stopped
net start postgresql-x64-14
```

---

## Getting Help

If migrations still fail after following this guide:

1. Check the application logs
2. Check PostgreSQL logs
3. Verify .env configuration
4. Run `npm run check-apis` to verify connectivity
5. Check this README for similar error messages

For more deployment information, see `DEPLOYMENT-README.md`
