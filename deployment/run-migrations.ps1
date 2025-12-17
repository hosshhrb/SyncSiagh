# SiaghSync Database Migration Script
# Run this to apply database migrations
# Usage: .\run-migrations.ps1 [-FixPermissions]

param(
    [switch]$FixPermissions = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "SiaghSync Database Migration" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please ensure .env file exists with DATABASE_URL configured" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Load DATABASE_URL from .env
$envContent = Get-Content ".env" -Raw
if ($envContent -match 'DATABASE_URL="([^"]+)"') {
    $dbUrl = $matches[1]
    Write-Host "Database: $dbUrl" -ForegroundColor Cyan
} elseif ($envContent -match "DATABASE_URL='([^']+)'") {
    $dbUrl = $matches[1]
    Write-Host "Database: $dbUrl" -ForegroundColor Cyan
} elseif ($envContent -match 'DATABASE_URL=([^\r\n]+)') {
    $dbUrl = $matches[1].Trim()
    Write-Host "Database: $dbUrl" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: Could not parse DATABASE_URL from .env" -ForegroundColor Yellow
}

Write-Host ""

# Extract database details from connection string for permission fix
if ($dbUrl -match 'postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]

    Write-Host "Database Details:" -ForegroundColor Yellow
    Write-Host "  Host: $dbHost" -ForegroundColor White
    Write-Host "  Port: $dbPort" -ForegroundColor White
    Write-Host "  Database: $dbName" -ForegroundColor White
    Write-Host "  User: $dbUser" -ForegroundColor White
    Write-Host ""
}

# Check for permission issues if requested
if ($FixPermissions) {
    Write-Host "Attempting to fix database permissions..." -ForegroundColor Yellow
    Write-Host ""

    # Check if psql is available
    $psqlAvailable = $false
    try {
        $psqlVersion = psql --version 2>$null
        if ($psqlVersion) {
            $psqlAvailable = $true
        }
    } catch {
        $psqlAvailable = $false
    }

    if ($psqlAvailable) {
        Write-Host "PostgreSQL client (psql) found" -ForegroundColor Green
        Write-Host ""
        Write-Host "You need to run the permission fix script as PostgreSQL superuser:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1 - Using psql (recommended):" -ForegroundColor Cyan
        Write-Host "  psql -U postgres -d $dbName -f fix-db-permissions.sql" -ForegroundColor Green
        Write-Host ""
        Write-Host "Option 2 - Using environment variable:" -ForegroundColor Cyan
        Write-Host '  $env:PGPASSWORD="your_postgres_password"' -ForegroundColor Green
        Write-Host "  psql -U postgres -d $dbName -f fix-db-permissions.sql" -ForegroundColor Green
        Write-Host ""

        $runNow = Read-Host "Try to run permission fix now? (requires postgres password) (y/n)"
        if ($runNow -eq "y" -or $runNow -eq "Y") {
            try {
                Write-Host "Running fix-db-permissions.sql..." -ForegroundColor Yellow
                psql -U postgres -d $dbName -f fix-db-permissions.sql
                Write-Host ""
                Write-Host "Permissions fixed successfully!" -ForegroundColor Green
                Write-Host ""
            } catch {
                Write-Host ""
                Write-Host "Failed to fix permissions automatically" -ForegroundColor Red
                Write-Host "Error: $_" -ForegroundColor Red
                Write-Host ""
                Write-Host "Please run the SQL script manually using pgAdmin or psql" -ForegroundColor Yellow
                Write-Host ""
            }
        }
    } else {
        Write-Host "PostgreSQL client (psql) not found in PATH" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To fix permissions, run this SQL script in pgAdmin or psql:" -ForegroundColor Cyan
        Write-Host "  fix-db-permissions.sql" -ForegroundColor Green
        Write-Host ""
        Write-Host "Or install PostgreSQL client tools to use psql" -ForegroundColor Yellow
        Write-Host ""
    }

    $continue = Read-Host "Continue with migrations? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Migration cancelled" -ForegroundColor Yellow
        exit 0
    }
    Write-Host ""
}

# Generate Prisma client first
Write-Host "Step 1: Generating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "  Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: Prisma client generation failed" -ForegroundColor Yellow
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host "  Attempting to continue with migration..." -ForegroundColor Yellow
}

Write-Host ""

# Run migrations
Write-Host "Step 2: Running Database Migrations..." -ForegroundColor Yellow
Write-Host ""

try {
    npx prisma migrate deploy
    Write-Host ""
    Write-Host "=================================" -ForegroundColor Green
    Write-Host "Migrations Completed Successfully!" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""

    # Show migration status
    Write-Host "Migration Status:" -ForegroundColor Cyan
    npx prisma migrate status
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "=================================" -ForegroundColor Red
    Write-Host "Migration Failed!" -ForegroundColor Red
    Write-Host "=================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""

    # Check if it's a permission error
    if ($_ -match "permission denied") {
        Write-Host "DIAGNOSIS: Permission Denied Error" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "The database user '$dbUser' doesn't have permission to create tables." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "SOLUTION: Run this script with -FixPermissions flag:" -ForegroundColor Cyan
        Write-Host "  .\run-migrations.ps1 -FixPermissions" -ForegroundColor Green
        Write-Host ""
        Write-Host "Or manually run fix-db-permissions.sql as PostgreSQL superuser:" -ForegroundColor Cyan
        Write-Host "  psql -U postgres -d $dbName -f fix-db-permissions.sql" -ForegroundColor Green
        Write-Host ""
    } elseif ($_ -match "does not exist") {
        Write-Host "DIAGNOSIS: Database or Connection Error" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "  1. Database '$dbName' doesn't exist" -ForegroundColor White
        Write-Host "  2. PostgreSQL is not running" -ForegroundColor White
        Write-Host "  3. DATABASE_URL in .env is incorrect" -ForegroundColor White
        Write-Host ""
        Write-Host "SOLUTION:" -ForegroundColor Cyan
        Write-Host "  1. Check if PostgreSQL is running" -ForegroundColor White
        Write-Host "  2. Verify DATABASE_URL in .env file" -ForegroundColor White
        Write-Host "  3. Create database: psql -U postgres -c ""CREATE DATABASE $dbName""" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "DIAGNOSIS: Unknown Error" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please check:" -ForegroundColor Cyan
        Write-Host "  1. DATABASE_URL in .env is correct" -ForegroundColor White
        Write-Host "  2. PostgreSQL is running and accessible" -ForegroundColor White
        Write-Host "  3. Database user has proper permissions" -ForegroundColor White
        Write-Host ""
    }

    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Database is now ready!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now:" -ForegroundColor Cyan
Write-Host "  1. Start the application: node dist/src/main.js" -ForegroundColor White
Write-Host "  2. Run initial import: npm run initial-import" -ForegroundColor White
Write-Host "  3. Test APIs: npm run test-all-apis" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
