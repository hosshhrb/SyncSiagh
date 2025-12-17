-- Fix PostgreSQL database permissions for SiaghSync
-- Run this as PostgreSQL superuser (postgres)
-- Usage: psql -U postgres -d siagh_sync -f fix-db-permissions.sql

-- Connect to the database
\c siagh_sync

-- Grant all privileges on the public schema to the application user
GRANT ALL ON SCHEMA public TO siagh_user;

-- Grant privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO siagh_user;

-- Grant privileges on all existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO siagh_user;

-- Grant privileges on all existing functions
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO siagh_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO siagh_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO siagh_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO siagh_user;

-- Ensure user can create objects in public schema
GRANT CREATE ON SCHEMA public TO siagh_user;

-- Verify permissions
SELECT
    schemaname,
    tablename,
    tableowner,
    has_table_privilege('siagh_user', schemaname || '.' || tablename, 'SELECT') as can_select,
    has_table_privilege('siagh_user', schemaname || '.' || tablename, 'INSERT') as can_insert,
    has_table_privilege('siagh_user', schemaname || '.' || tablename, 'UPDATE') as can_update,
    has_table_privilege('siagh_user', schemaname || '.' || tablename, 'DELETE') as can_delete
FROM pg_tables
WHERE schemaname = 'public';

-- Show schema privileges
SELECT
    nspname as schema_name,
    has_schema_privilege('siagh_user', nspname, 'CREATE') as can_create,
    has_schema_privilege('siagh_user', nspname, 'USAGE') as can_use
FROM pg_namespace
WHERE nspname = 'public';

\echo 'Database permissions fixed successfully!'
\echo 'You can now run: npx prisma migrate deploy'
