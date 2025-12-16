# SiaghSync Windows Deployment Script
# Run this script on Windows server as Administrator
# Usage: .\deploy-windows.ps1 [-SkipPrompts] [-CheckAPIs]
#
# Examples:
#   .\deploy-windows.ps1                  # Interactive mode
#   .\deploy-windows.ps1 -SkipPrompts     # Auto-install without prompts
#   .\deploy-windows.ps1 -CheckAPIs       # Run API check after setup

param(
    [switch]$SkipPrompts = $false,
    [switch]$CheckAPIs = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "SiaghSync Windows Deployment" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Error: Must run as Administrator" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "   Node.js $nodeVersion found" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {
    $nodeInstalled = $false
}

if (-not $nodeInstalled) {
    Write-Host "   Node.js not found!" -ForegroundColor Red
    Write-Host "   Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "   After installation, restart PowerShell and run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
$npmInstalled = $false
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "   npm $npmVersion found" -ForegroundColor Green
        $npmInstalled = $true
    }
} catch {
    $npmInstalled = $false
}

if (-not $npmInstalled) {
    Write-Host "   npm not found!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if we're in the deployment directory
if (-not (Test-Path "dist") -or -not (Test-Path "package.json")) {
    Write-Host "Error: Must run from deployment directory" -ForegroundColor Red
    Write-Host "   This script should be in the same folder as dist/ and package.json" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if this is an update
$isUpdate = Test-Path "node_modules"
if ($isUpdate) {
    Write-Host "Detected existing installation - performing update..." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Performing fresh installation..." -ForegroundColor Yellow
    Write-Host ""
}

# Install production dependencies
Write-Host "Installing production dependencies..." -ForegroundColor Yellow
try {
    if (Test-Path "package-lock.json") {
        Write-Host "   Using package-lock.json for clean install..." -ForegroundColor Cyan
        npm ci --production
    } else {
        Write-Host "   No package-lock.json found, using npm install..." -ForegroundColor Yellow
        npm install --production
    }
    Write-Host "   Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "   Failed to install dependencies" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Trying alternative method..." -ForegroundColor Yellow
    try {
        npm install --production
        Write-Host "   Dependencies installed (alternative method)" -ForegroundColor Green
    } catch {
        Write-Host "   Installation failed completely" -ForegroundColor Red
        Write-Host ""
        if (-not $SkipPrompts) {
            Read-Host "Press Enter to exit"
        }
        exit 1
    }
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
    Write-Host "   You may need to run: npm install @prisma/client" -ForegroundColor Yellow
}

Write-Host ""

# Check .env file
Write-Host "Checking configuration..." -ForegroundColor Yellow
$envExists = Test-Path ".env"
if (-not $envExists) {
    Write-Host "   .env file not found!" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "   Copying .env.example to .env..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "   .env file created" -ForegroundColor Green
        Write-Host ""
        Write-Host "   IMPORTANT: Edit .env file with your actual credentials!" -ForegroundColor Red
        Write-Host ""
        if (-not $SkipPrompts) {
            $editNow = Read-Host "   Open .env file for editing now? (y/n)"
            if ($editNow -eq "y" -or $editNow -eq "Y") {
                notepad .env
            }
        }
    } else {
        Write-Host "   .env.example not found!" -ForegroundColor Red
        Write-Host "   Please create .env file manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "   .env file found" -ForegroundColor Green
    if ($isUpdate) {
        Write-Host "   Using existing configuration" -ForegroundColor Cyan
    }
}

Write-Host ""

# Check database connection
Write-Host "Database Setup" -ForegroundColor Yellow
Write-Host "   Make sure PostgreSQL is running and DATABASE_URL is correct in .env" -ForegroundColor Cyan
Write-Host ""

$runMigrations = $SkipPrompts
if (-not $SkipPrompts) {
    $response = Read-Host "   Run database migrations now? (y/n)"
    $runMigrations = ($response -eq "y" -or $response -eq "Y")
}

if ($runMigrations) {
    try {
        Write-Host "   Running migrations..." -ForegroundColor Yellow
        npx prisma migrate deploy
        Write-Host "   Migrations completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "   Migration failed" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
        Write-Host "   Please check DATABASE_URL in .env and ensure PostgreSQL is running" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Skipping migrations" -ForegroundColor Yellow
    Write-Host "   Run manually later: npx prisma migrate deploy" -ForegroundColor Cyan
}

Write-Host ""

# Check Redis
Write-Host "Redis Setup" -ForegroundColor Yellow
Write-Host "   Make sure Redis is running or use cloud Redis" -ForegroundColor Cyan
Write-Host "   Update REDIS_HOST and REDIS_PORT in .env if needed" -ForegroundColor Cyan
Write-Host ""

# Check APIs if requested or if .env exists
if ($CheckAPIs -or ($envExists -and -not $SkipPrompts)) {
    Write-Host ""
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host "API Connectivity Check" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""

    $doApiCheck = $CheckAPIs
    if (-not $CheckAPIs -and -not $SkipPrompts) {
        $response = Read-Host "   Run API connectivity check now? (y/n)"
        $doApiCheck = ($response -eq "y" -or $response -eq "Y")
    }

    if ($doApiCheck) {
        try {
            Write-Host "   Running API check..." -ForegroundColor Yellow
            Write-Host ""
            npm run check-apis
            Write-Host ""
            Write-Host "   API check completed" -ForegroundColor Green
        } catch {
            Write-Host ""
            Write-Host "   API check failed or had issues" -ForegroundColor Yellow
            Write-Host "   Error: $_" -ForegroundColor Yellow
            Write-Host "   Please verify your .env configuration and try again" -ForegroundColor Cyan
            Write-Host "   You can run 'npm run check-apis' manually later" -ForegroundColor Cyan
        }
    }
}

Write-Host ""

# Service installation info
Write-Host "Windows Service Installation (Optional)" -ForegroundColor Yellow
Write-Host "   To run as Windows Service with PM2:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Install PM2 globally:" -ForegroundColor White
Write-Host "      npm install -g pm2 pm2-windows-service" -ForegroundColor Green
Write-Host ""
Write-Host "   2. Install PM2 as Windows Service:" -ForegroundColor White
Write-Host "      pm2-service-install" -ForegroundColor Green
Write-Host ""
Write-Host "   3. Start application:" -ForegroundColor White
Write-Host "      pm2 start dist/src/main.js --name siaghsync" -ForegroundColor Green
Write-Host ""
Write-Host "   4. Save PM2 configuration:" -ForegroundColor White
Write-Host "      pm2 save" -ForegroundColor Green
Write-Host ""

$installService = $false
if (-not $SkipPrompts) {
    $response = Read-Host "   Install PM2 and set up service now? (y/n)"
    $installService = ($response -eq "y" -or $response -eq "Y")
}

if ($installService) {
    Write-Host "   Installing PM2..." -ForegroundColor Yellow
    try {
        npm install -g pm2 pm2-windows-service
        Write-Host "   PM2 installed" -ForegroundColor Green
        Write-Host ""
        Write-Host "   Installing PM2 as Windows Service..." -ForegroundColor Yellow
        pm2-service-install
        Write-Host "   PM2 service installed" -ForegroundColor Green
        Write-Host ""
        Write-Host "   Starting application with PM2..." -ForegroundColor Yellow
        pm2 start dist/src/main.js --name siaghsync
        pm2 save
        Write-Host "   Application started as service" -ForegroundColor Green
        Write-Host ""
        Write-Host "   View logs: pm2 logs siaghsync" -ForegroundColor Cyan
        Write-Host "   Monitor: pm2 monit" -ForegroundColor Cyan
        Write-Host "   Stop: pm2 stop siaghsync" -ForegroundColor Cyan
    } catch {
        Write-Host "   Service installation failed" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
    }
}

Write-Host ""

# Start application
Write-Host "Application Start" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Manual start:" -ForegroundColor Cyan
Write-Host "     node dist/src/main.js" -ForegroundColor Green
Write-Host ""
Write-Host "   Or use PM2:" -ForegroundColor Cyan
Write-Host "     pm2 start dist/src/main.js --name siaghsync" -ForegroundColor Green
Write-Host ""

$startNow = $false
if (-not $SkipPrompts) {
    $response = Read-Host "   Start application now? (y/n)"
    $startNow = ($response -eq "y" -or $response -eq "Y")
}

if ($startNow) {
    Write-Host ""
    Write-Host "   Starting SiaghSync..." -ForegroundColor Green
    Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    node dist/src/main.js
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "Deployment Completed Successfully!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

if ($isUpdate) {
    Write-Host "Application updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Restart application if running as service: pm2 restart siaghsync" -ForegroundColor White
    Write-Host "   2. Or restart manually if running in console" -ForegroundColor White
    Write-Host "   3. Check API connectivity: npm run check-apis" -ForegroundColor White
} else {
    Write-Host "Fresh installation completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Edit .env with your credentials (if not done)" -ForegroundColor White
    Write-Host "   2. Run API check: npm run check-apis" -ForegroundColor White
    Write-Host "   3. Run initial import: npm run initial-import (one-time)" -ForegroundColor White
    Write-Host "   4. Start application: node dist/src/main.js" -ForegroundColor White
    Write-Host "   5. Or use PM2: pm2 start dist/src/main.js --name siaghsync" -ForegroundColor White
}

Write-Host ""
Write-Host "For more information, see DEPLOYMENT-README.md" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipPrompts) {
    Read-Host "Press Enter to exit"
}
