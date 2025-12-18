# SiaghSync Database Migration Script for Windows
# This script helps run Prisma migrations and fix common database permission issues
# Usage:
#   .\run-migrations.ps1          - Run migrations normally
#   .\run-migrations.ps1 -Fix     - Show instructions to fix permission errors
#   .\run-migrations.ps1 -Check   - Check database connection and permissions

param(
    [switch]$Fix,
    [switch]$Check
)

# Colors
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Info "======================================"
Write-Info "   SiaghSync Database Migration Tool"
Write-Info "======================================"
Write-Host ""

# Hardcoded default credentials (can be overridden by .env)
$defaultDbUrl = "postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Warning "⚠️  .env file not found, using hardcoded credentials"
    Write-Host ""
    $dbUrl = $defaultDbUrl
} else {
    # Load DATABASE_URL from .env
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'DATABASE_URL\s*=\s*[''"]?([^''"]+)[''"]?') {
        $dbUrl = $matches[1]
        Write-Success "✅ Found DATABASE_URL in .env"
    } else {
        Write-Warning "⚠️  Could not find DATABASE_URL in .env, using hardcoded credentials"
        $dbUrl = $defaultDbUrl
    }
}

# Set DATABASE_URL environment variable for Prisma
$env:DATABASE_URL = $dbUrl

# Parse database details
if ($dbUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]

    Write-Host "   User: $dbUser"
    Write-Host "   Host: ${dbHost}:${dbPort}"
    Write-Host "   Database: $dbName"
} else {
    Write-Error "❌ Could not parse DATABASE_URL format"
    Write-Host "   Expected format: postgresql://user:password@host:port/database"
    exit 1
}

Write-Host ""

# ============================================================================
# CHECK MODE
# ============================================================================
if ($Check) {
    Write-Info "Checking database connection and permissions..."
    Write-Host ""

    # Test basic connection
    Write-Info "Testing database connection..."
    $testResult = npx prisma db push --skip-generate --accept-data-loss 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Database connection successful"
        Write-Success "✅ User has sufficient permissions"
        Write-Host ""
        Write-Info "You can now run migrations with:"
        Write-Host "   npx prisma migrate deploy"
    } else {
        if ($testResult -match "permission denied") {
            Write-Error "❌ Permission denied error detected"
            Write-Host ""
            Write-Warning "Run with -Fix flag to see how to fix this:"
            Write-Host "   .\run-migrations.ps1 -Fix"
        } else {
            Write-Error "❌ Database connection failed"
            Write-Host ""
            Write-Host $testResult
        }
    }

    exit $LASTEXITCODE
}

# ============================================================================
# FIX MODE - Show instructions to fix permission errors
# ============================================================================
if ($Fix) {
    Write-Info "Database Permission Fix Instructions"
    Write-Host ""
    Write-Host "The error 'permission denied for schema public' means your PostgreSQL user"
    Write-Host "doesn't have the required permissions to create/modify tables."
    Write-Host ""
    Write-Success "========== SOLUTION =========="
    Write-Host ""
    Write-Host "1. Open PostgreSQL command line as superuser (postgres):"
    Write-Host ""
    Write-Warning "   psql -U postgres -d $dbName"
    Write-Host ""
    Write-Host "2. Run these SQL commands to grant permissions:"
    Write-Host ""
    Write-Warning "   GRANT ALL ON SCHEMA public TO $dbUser;"
    Write-Warning "   GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;"
    Write-Warning "   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $dbUser;"
    Write-Warning "   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $dbUser;"
    Write-Warning "   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $dbUser;"
    Write-Warning "   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $dbUser;"
    Write-Host ""
    Write-Host "3. Exit psql (type \q) and try running migrations again:"
    Write-Host ""
    Write-Warning "   npx prisma migrate deploy"
    Write-Host ""
    Write-Success "========== ALTERNATIVE: Automated Fix =========="
    Write-Host ""
    Write-Host "We can also create a SQL file for you to run:"
    Write-Host ""

    # Create a customized SQL file
    $sqlContent = @"
-- Auto-generated permission fix for SiaghSync
-- Database: $dbName
-- User: $dbUser

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO $dbUser;
GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;

-- Grant permissions on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $dbUser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $dbUser;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO $dbUser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO $dbUser;

-- Verification: Check if permissions are set
SELECT 'Permissions granted successfully!' AS status;
"@

    $sqlContent | Out-File -FilePath "fix-permissions-$dbName.sql" -Encoding UTF8

    Write-Success "✅ Created file: fix-permissions-$dbName.sql"
    Write-Host ""
    Write-Host "Run this file as PostgreSQL superuser:"
    Write-Warning "   psql -U postgres -d $dbName -f fix-permissions-$dbName.sql"
    Write-Host ""

    exit 0
}

# ============================================================================
# NORMAL MODE - Run migrations
# ============================================================================
Write-Info "Running database migrations..."
Write-Host ""

# First, ensure Prisma client is generated
Write-Info "Step 1: Generating Prisma client..."
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to generate Prisma client"
    exit 1
}

Write-Success "✅ Prisma client generated"
Write-Host ""

# Run migrations
Write-Info "Step 2: Applying database migrations..."
$output = npx prisma migrate deploy 2>&1
$exitCode = $LASTEXITCODE

# Display output
Write-Host $output

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Error "❌ Migration failed!"

    # Check for common errors
    if ($output -match "permission denied") {
        Write-Host ""
        Write-Warning "⚠️  Permission denied error detected."
        Write-Warning "This usually means your database user doesn't have sufficient permissions."
        Write-Host ""
        Write-Info "To fix this issue, run:"
        Write-Warning "   .\run-migrations.ps1 -Fix"
        Write-Host ""
    } elseif ($output -match "database .* does not exist") {
        Write-Host ""
        Write-Warning "⚠️  Database doesn't exist."
        Write-Host ""
        Write-Info "Create the database first:"
        Write-Warning "   psql -U postgres"
        Write-Warning "   CREATE DATABASE $dbName;"
        Write-Warning "   GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;"
        Write-Warning "   \q"
        Write-Host ""
    } elseif ($output -match "connect ECONNREFUSED") {
        Write-Host ""
        Write-Warning "⚠️  Cannot connect to PostgreSQL server."
        Write-Host ""
        Write-Info "Make sure PostgreSQL is running:"
        Write-Warning "   - Check if PostgreSQL service is started"
        Write-Warning "   - Verify host and port in DATABASE_URL"
        Write-Warning "   - Check firewall settings"
        Write-Host ""
    }

    exit $exitCode
}

Write-Host ""
Write-Success "======================================"
Write-Success "   ✅ Migrations completed successfully!"
Write-Success "======================================"
Write-Host ""
Write-Info "Next steps:"
Write-Host "  1. Check API connectivity: npm run check-apis"
Write-Host "  2. Test all APIs: npm run test-all-apis"
Write-Host "  3. Start the application: node dist/src/main.js"
Write-Host ""
