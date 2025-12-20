# SiaghSync Update Script
# Run this after transferring new code to Windows server
# Usage: .\update.ps1 [-CheckAPIs] [-Restart]

param(
    [switch]$CheckAPIs = $false,
    [switch]$Restart = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "SiaghSync Update" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the deployment directory
if (-not (Test-Path "dist") -or -not (Test-Path "package.json")) {
    Write-Host "Error: Must run from deployment directory" -ForegroundColor Red
    Write-Host "   cd C:\Users\adminapp\SyncSiagh\deployment" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if application is running
Write-Host "Checking if application is running..." -ForegroundColor Yellow
$pm2Running = $false
try {
    $pm2List = pm2 list 2>$null
    if ($pm2List -match "siaghsync") {
        $pm2Running = $true
        Write-Host "   Application is running with PM2" -ForegroundColor Green

        Write-Host ""
        Write-Host "Stopping application..." -ForegroundColor Yellow
        pm2 stop siaghsync
        Write-Host "   Application stopped" -ForegroundColor Green
    }
} catch {
    Write-Host "   Application not running with PM2" -ForegroundColor Cyan
}

Write-Host ""

# Install/Update dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Cyan
Write-Host ""

try {
    # Install all dependencies (including dev) to get Prisma CLI for migrations
    # Production-only installs skip devDependencies which includes the prisma CLI
    if (Test-Path "package-lock.json") {
        npm ci
    } else {
        npm install
    }
    Write-Host ""
    Write-Host "   Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "   Failed to install dependencies" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "   Prisma client generated" -ForegroundColor Green
} catch {
    Write-Host "   Warning: Prisma generation failed" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Yellow
}

Write-Host ""

# Run migrations
Write-Host "Database Migrations" -ForegroundColor Yellow
$runMigrations = Read-Host "   Run database migrations? (y/n)"
if ($runMigrations -eq "y" -or $runMigrations -eq "Y") {
    try {
        Write-Host "   Running migrations..." -ForegroundColor Yellow
        npx prisma migrate deploy
        Write-Host "   Migrations completed" -ForegroundColor Green
    } catch {
        Write-Host "   Migration failed" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red

        # Check if it's a permission error
        if ($_ -match "permission denied") {
            Write-Host ""
            Write-Host "   This looks like a database permission issue" -ForegroundColor Yellow
            Write-Host "   You can fix this by running:" -ForegroundColor Cyan
            Write-Host "     .\run-migrations.bat fix" -ForegroundColor Green
            Write-Host ""
            Write-Host "   Or see MIGRATION-README.md for manual fix steps" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "   Skipping migrations" -ForegroundColor Cyan
    Write-Host "   You can run migrations later with: .\run-migrations.bat" -ForegroundColor Cyan
}

Write-Host ""

# Check APIs
if ($CheckAPIs) {
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host "API Connectivity Check" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""

    try {
        npm run check-apis
        Write-Host ""
        Write-Host "   API check completed" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "   API check had issues" -ForegroundColor Yellow
        Write-Host "   Please verify your .env configuration" -ForegroundColor Cyan
    }
    Write-Host ""
}

# Restart application
if ($pm2Running -or $Restart) {
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host "Restarting Application" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""

    if ($pm2Running) {
        try {
            Write-Host "Restarting with PM2..." -ForegroundColor Yellow
            pm2 restart siaghsync
            Write-Host "   Application restarted" -ForegroundColor Green
            Write-Host ""
            Write-Host "   View logs: pm2 logs siaghsync" -ForegroundColor Cyan
            Write-Host "   Monitor: pm2 monit" -ForegroundColor Cyan
        } catch {
            Write-Host "   Failed to restart with PM2" -ForegroundColor Red
            Write-Host "   Error: $_" -ForegroundColor Red
            Write-Host "   Please start manually: pm2 start dist/src/main.js --name siaghsync" -ForegroundColor Yellow
        }
    } else {
        $startNow = Read-Host "   Start application now? (y/n)"
        if ($startNow -eq "y" -or $startNow -eq "Y") {
            Write-Host ""
            Write-Host "   Starting SiaghSync..." -ForegroundColor Green
            Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
            Write-Host ""
            node dist/src/main.js
        }
    }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "Update Completed Successfully!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

if (-not $pm2Running -and -not $Restart) {
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Test APIs: npm run check-apis" -ForegroundColor White
    Write-Host "   2. Start application: node dist/src/main.js" -ForegroundColor White
    Write-Host "   3. Or with PM2: pm2 restart siaghsync" -ForegroundColor White
    Write-Host ""
}

Read-Host "Press Enter to exit"
