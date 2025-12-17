# Database Migration Guide for SiaghSync

This guide helps you set up and troubleshoot database migrations on Windows.

## Quick Start

### Option 1: Using the Migration Script (Recommended)

```batch
run-migrations.bat
```

Or with PowerShell for more features:

```powershell
.\run-migrations.ps1
```

### Option 2: Manual Migration

```powershell
npx prisma generate
npx prisma migrate deploy
```

---

## Common Issues and Solutions

### Issue 1: "Permission denied for schema public"

**Error Message:**
```
Error: ERROR: permission denied for schema public
```

**Cause:** Your PostgreSQL user doesn't have sufficient permissions to create or modify database schema.

**Solution:**

#### Method A: Using the Fix Script (Easiest)

```batch
run-migrations.bat fix
```

Or:

```powershell
.\run-migrations.ps1 -Fix
```

This will create a SQL file customized for your database that you can run.

#### Method B: Manual Permission Fix

1. **Connect to PostgreSQL as superuser:**

   ```bash
   psql -U postgres -d siagh_sync
   ```

2. **Grant permissions to your user** (replace `your_user` with actual username from DATABASE_URL):

   ```sql
   GRANT ALL ON SCHEMA public TO your_user;
   GRANT ALL PRIVILEGES ON DATABASE siagh_sync TO your_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO your_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO your_user;
   ```

3. **Exit and retry migration:**

   ```
   \q
   npx prisma migrate deploy
   ```

#### Method C: Use Superuser (Quick but less secure)

Update your `.env` file to use the `postgres` superuser:

```env
DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/siagh_sync"
```

**Note:** This is less secure for production. Use method A or B instead.

---

### Issue 2: "database 'siagh_sync' does not exist"

**Error Message:**
```
Error: database "siagh_sync" does not exist
```

**Solution:**

1. **Connect to PostgreSQL as superuser:**

   ```bash
   psql -U postgres
   ```

2. **Create the database:**

   ```sql
   CREATE DATABASE siagh_sync;
   GRANT ALL PRIVILEGES ON DATABASE siagh_sync TO your_user;
   \q
   ```

3. **Retry migration:**

   ```batch
   run-migrations.bat
   ```

---

### Issue 3: "connect ECONNREFUSED" or "Connection refused"

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause:** PostgreSQL server is not running or not accessible.

**Solution:**

1. **Check if PostgreSQL is running:**

   ```powershell
   # On Windows, check services
   Get-Service postgresql*
   ```

2. **Start PostgreSQL if stopped:**

   ```powershell
   # Using Windows Services
   Start-Service postgresql-x64-14  # Version number may vary

   # Or from Start menu: Services -> PostgreSQL -> Start
   ```

3. **Verify connection details in `.env`:**

   - Check host (usually `localhost`)
   - Check port (usually `5432`)
   - Ensure PostgreSQL is configured to accept connections

4. **Check PostgreSQL is listening:**

   ```powershell
   netstat -an | Select-String "5432"
   ```

   You should see `LISTENING` on port 5432.

---

### Issue 4: "The table 'public.EntityMapping' does not exist"

**Error Message:**
```
The table `public.EntityMapping` does not exist in the current database.
```

**Cause:** Migrations haven't been run yet, or migration failed.

**Solution:**

1. **Run migrations:**

   ```batch
   run-migrations.bat
   ```

2. **If you get permission errors**, see Issue 1 above.

3. **Verify tables were created:**

   ```bash
   psql -U your_user -d siagh_sync
   \dt
   ```

   You should see tables like `EntityMapping`, `SyncLog`, `WebhookLog`, etc.

---

## Checking Database Status

### Quick Health Check

```powershell
.\run-migrations.ps1 -Check
```

This will:
- Test database connection
- Verify user permissions
- Show any configuration issues

### Manual Verification

1. **Check database connection:**

   ```bash
   psql -U your_user -d siagh_sync
   ```

2. **List all tables:**

   ```sql
   \dt
   ```

   Expected tables:
   - `EntityMapping`
   - `SyncLog`
   - `WebhookLog`
   - `_prisma_migrations`

3. **Check migration status:**

   ```sql
   SELECT * FROM _prisma_migrations;
   ```

4. **Exit:**

   ```sql
   \q
   ```

---

## Understanding Your DATABASE_URL

The `DATABASE_URL` in your `.env` file has this format:

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Example:
```
DATABASE_URL="postgresql://siagh_user:mypassword@localhost:5432/siagh_sync"
```

Breaking it down:
- **USER**: `siagh_user` - PostgreSQL username
- **PASSWORD**: `mypassword` - User's password
- **HOST**: `localhost` - Database server location (localhost = same machine)
- **PORT**: `5432` - PostgreSQL default port
- **DATABASE**: `siagh_sync` - Database name

**Important:** The user must have permission to create tables in this database!

---

## Setting Up PostgreSQL User (First Time)

If you're setting up a new database and user:

1. **Connect as superuser:**

   ```bash
   psql -U postgres
   ```

2. **Create database and user:**

   ```sql
   -- Create user
   CREATE USER siagh_user WITH PASSWORD 'your_secure_password';

   -- Create database
   CREATE DATABASE siagh_sync;

   -- Grant all privileges
   GRANT ALL PRIVILEGES ON DATABASE siagh_sync TO siagh_user;

   -- Connect to the database
   \c siagh_sync

   -- Grant schema permissions
   GRANT ALL ON SCHEMA public TO siagh_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO siagh_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO siagh_user;

   -- Verify
   \l siagh_sync
   \du siagh_user

   -- Exit
   \q
   ```

3. **Update your `.env` file:**

   ```env
   DATABASE_URL="postgresql://siagh_user:your_secure_password@localhost:5432/siagh_sync"
   ```

4. **Run migrations:**

   ```batch
   run-migrations.bat
   ```

---

## Migration Workflow

### Normal Application Update

When you receive updated code:

1. **Stop the application** (if running)

2. **Copy new files** to deployment directory

3. **Install dependencies:**

   ```powershell
   npm ci --production
   ```

4. **Regenerate Prisma client:**

   ```powershell
   npx prisma generate
   ```

5. **Run migrations:**

   ```batch
   run-migrations.bat
   ```

6. **Restart application:**

   ```powershell
   pm2 restart siaghsync
   # Or: node dist/src/main.js
   ```

### Using the Update Script

The `update.ps1` script automates the above steps:

```powershell
# Interactive update
.\update.ps1

# Update and check APIs
.\update.ps1 -CheckAPIs

# Update, check APIs, and auto-restart
.\update.ps1 -CheckAPIs -Restart
```

---

## Troubleshooting Commands

### Test database connection:
```powershell
npx prisma db pull --force
```

### View migration history:
```bash
psql -U your_user -d siagh_sync -c "SELECT * FROM _prisma_migrations;"
```

### Reset database (⚠️ DELETES ALL DATA):
```powershell
# Be very careful with this!
npx prisma migrate reset --skip-seed
```

### Generate new migration (for development only):
```powershell
npx prisma migrate dev --name migration_name
```

### Check Prisma schema syntax:
```powershell
npx prisma validate
```

---

## Getting Help

If you're still having issues:

1. **Check the logs:**
   - Application logs (console output or PM2 logs)
   - PostgreSQL logs (usually in PostgreSQL data directory)

2. **Verify PostgreSQL version:**
   ```bash
   psql --version
   ```
   Recommended: PostgreSQL 12 or higher

3. **Check PostgreSQL configuration:**
   - File: `postgresql.conf`
   - Ensure `listen_addresses` includes your connection address
   - Ensure `port` matches your DATABASE_URL

4. **Test with Prisma Studio:**
   ```powershell
   npx prisma studio
   ```
   Opens a web interface to view database (if connection works)

---

## Advanced: PostgreSQL Configuration

### Allow Remote Connections (if needed)

Edit `postgresql.conf`:
```
listen_addresses = '*'  # Or specific IP
```

Edit `pg_hba.conf`:
```
# Allow connections from specific IP
host    siagh_sync    siagh_user    192.168.1.0/24    md5

# Or allow from anywhere (less secure)
host    all           all           0.0.0.0/0         md5
```

Restart PostgreSQL after changes.

### Performance Tuning

For better performance with sync operations:

```sql
-- Increase connection pool
ALTER SYSTEM SET max_connections = 200;

-- Optimize for better write performance
ALTER SYSTEM SET synchronous_commit = off;  -- Only if you can tolerate some data loss

-- Increase work memory for complex queries
ALTER SYSTEM SET work_mem = '64MB';

-- Reload configuration
SELECT pg_reload_conf();
```

---

## Security Best Practices

1. **Never use `postgres` superuser in production**
2. **Use strong passwords** (mix of letters, numbers, symbols)
3. **Limit user permissions** to only what's needed
4. **Keep DATABASE_URL secure** - never commit to version control
5. **Regularly backup your database:**
   ```bash
   pg_dump -U your_user siagh_sync > backup.sql
   ```
6. **Use SSL connections** for remote databases:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```

---

## Need More Help?

- Check PostgreSQL logs for detailed error messages
- Review `.env` configuration
- Ensure all prerequisites are installed (Node.js 18+, PostgreSQL 12+)
- Make sure PostgreSQL service is running
- Verify network connectivity if using remote database

If migration script fails, it will provide specific suggestions based on the error type.
