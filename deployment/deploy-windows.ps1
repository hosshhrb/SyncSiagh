# SiaghSync Windows Deployment Script
# Run this script on Windows server as Administrator

Write-Host "🚀 SiaghSync Windows Deployment" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Error: Must run as Administrator" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check Node.js
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm not found!" -ForegroundColor Red
    exit 1
}

# Install production dependencies
Write-Host ""
Write-Host "📥 Installing production dependencies..." -ForegroundColor Yellow
npm ci --production

# Generate Prisma client
Write-Host ""
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Check .env file
Write-Host ""
Write-Host "🔍 Checking configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "   ⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "   Copying .env.example to .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "   ⚠️  Please edit .env file with your actual credentials!" -ForegroundColor Red
    Write-Host ""
    notepad .env
}

# Run database migrations
Write-Host ""
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
Write-Host "   Make sure PostgreSQL is running and DATABASE_URL is correct in .env" -ForegroundColor Yellow
$runMigrations = Read-Host "   Run migrations now? (y/n)"
if ($runMigrations -eq "y" -or $runMigrations -eq "Y") {
    npx prisma migrate deploy
    Write-Host "   ✅ Migrations completed" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  Skipping migrations" -ForegroundColor Yellow
}

# Create Windows Service (optional)
Write-Host ""
Write-Host "🔧 Service Installation" -ForegroundColor Yellow
Write-Host "   To run as Windows Service, install pm2-windows-service:" -ForegroundColor Cyan
Write-Host "   npm install -g pm2 pm2-windows-service" -ForegroundColor Cyan
Write-Host "   pm2-service-install" -ForegroundColor Cyan
Write-Host "   pm2 start dist/main.js --name siaghsync" -ForegroundColor Cyan
Write-Host "   pm2 save" -ForegroundColor Cyan
Write-Host ""

# Start application
Write-Host "🚀 Starting application..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   To start manually:" -ForegroundColor Cyan
Write-Host "   node dist/main.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Or with PM2:" -ForegroundColor Cyan
Write-Host "   pm2 start dist/main.js --name siaghsync" -ForegroundColor Cyan
Write-Host ""

$startNow = Read-Host "   Start application now? (y/n)"
if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host "   Starting..." -ForegroundColor Green
    node dist/main.js
}

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Edit .env with your credentials" -ForegroundColor White
Write-Host "   2. Run: npm run initial-import (one-time)" -ForegroundColor White
Write-Host "   3. Start: node dist/main.js" -ForegroundColor White
Write-Host "   4. Monitor: npm run prisma:studio" -ForegroundColor White
Write-Host ""
