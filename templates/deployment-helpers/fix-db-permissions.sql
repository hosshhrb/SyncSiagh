-- Database Permission Fix for SiaghSync
-- This script fixes "permission denied for schema public" errors
-- Run this as PostgreSQL superuser (postgres)

-- ============================================================================
-- OPTION 1: Fix permissions for existing user
-- ============================================================================
-- Replace 'your_db_user' with the username from your DATABASE_URL
-- Replace 'siagh_sync' with your database name

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO your_db_user;
GRANT ALL PRIVILEGES ON DATABASE siagh_sync TO your_db_user;

-- Grant permissions on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO your_db_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO your_db_user;

-- Make user owner of schema (optional but recommended)
-- ALTER SCHEMA public OWNER TO your_db_user;

-- ============================================================================
-- OPTION 2: Create new database with proper permissions
-- ============================================================================
-- Uncomment and run these commands if you want to start fresh

-- DROP DATABASE IF EXISTS siagh_sync;
-- CREATE DATABASE siagh_sync;
-- GRANT ALL PRIVILEGES ON DATABASE siagh_sync TO your_db_user;
-- \c siagh_sync
-- GRANT ALL ON SCHEMA public TO your_db_user;
-- ALTER SCHEMA public OWNER TO your_db_user;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify permissions are set correctly:

-- Check database permissions
-- SELECT datname, datacl FROM pg_database WHERE datname = 'siagh_sync';

-- Check schema permissions
-- SELECT schema_name, schema_owner FROM information_schema.schemata WHERE schema_name = 'public';

-- Check current user privileges
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND grantee = 'your_db_user';
