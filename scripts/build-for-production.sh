#!/bin/bash
# Build script for Linux (Fedora) - Prepares deployment package for Windows server
# Usage: ./scripts/build-for-production.sh

set -e  # Exit on error

echo "🚀 Building SiaghSync for Windows production deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

# Create deployment directory
DEPLOY_DIR="deployment"
echo -e "${YELLOW}📦 Creating deployment directory...${NC}"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Install dependencies and build
echo -e "${YELLOW}📥 Installing dependencies...${NC}"

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    echo -e "${GREEN}   Using package-lock.json for clean install${NC}"
    npm ci --production=false || {
        echo -e "${RED}   npm ci failed, trying npm install...${NC}"
        npm install --production=false
    }
else
    echo -e "${YELLOW}   No package-lock.json found, using npm install${NC}"
    npm install --production=false
fi

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    echo -e "${YELLOW}   This might be due to network issues.${NC}"
    echo -e "${YELLOW}   Please check your internet connection and try again.${NC}"
    exit 1
fi

echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Copy necessary files
echo -e "${YELLOW}📋 Copying files to deployment package...${NC}"

# Application files
cp -r dist "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"

# Copy package-lock.json if it exists
if [ -f "package-lock.json" ]; then
    cp package-lock.json "$DEPLOY_DIR/"
    echo -e "${GREEN}   ✅ package-lock.json included${NC}"
else
    echo -e "${YELLOW}   ⚠️  package-lock.json not found (will be generated on Windows)${NC}"
fi

# Configuration
if [ -f ".env.example" ]; then
    cp .env.example "$DEPLOY_DIR/.env.example"
    echo -e "${GREEN}✅ .env.example included${NC}"
else
    echo -e "${YELLOW}⚠️  .env.example not found${NC}"
fi

if [ -f ".env.production" ]; then
    cp .env.production "$DEPLOY_DIR/.env"
    echo -e "${GREEN}✅ Using .env.production${NC}"
elif [ -f ".env.example" ]; then
    echo -e "${YELLOW}⚠️  No .env.production found, using .env.example${NC}"
    cp .env.example "$DEPLOY_DIR/.env"
else
    echo -e "${YELLOW}⚠️  No .env files found, create .env manually on Windows${NC}"
fi

# Prisma files
cp -r prisma "$DEPLOY_DIR/"
cp node_modules/.prisma "$DEPLOY_DIR/node_modules/.prisma" 2>/dev/null || true

# Documentation
mkdir -p "$DEPLOY_DIR/docs"
cp README.md "$DEPLOY_DIR/docs/" 2>/dev/null || true
cp SETUP.md "$DEPLOY_DIR/docs/" 2>/dev/null || true
cp DEPLOYMENT.md "$DEPLOY_DIR/docs/" 2>/dev/null || true

# Create Windows deployment script
cat > "$DEPLOY_DIR/deploy-windows.ps1" << 'EOF'
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
EOF

# Create Windows batch file for easy start
cat > "$DEPLOY_DIR/start.bat" << 'EOF'
@echo off
echo Starting SiaghSync...
node dist/main.js
pause
EOF

# Create Windows batch file for PM2
cat > "$DEPLOY_DIR/start-pm2.bat" << 'EOF'
@echo off
echo Starting SiaghSync with PM2...
pm2 start dist/main.js --name siaghsync
pm2 save
pm2 monit
pause
EOF

# Create README for deployment
cat > "$DEPLOY_DIR/DEPLOYMENT-README.md" << 'EOF'
# SiaghSync Windows Deployment Guide

## Quick Start

1. **Copy this entire folder to Windows server**

2. **Run deployment script:**
   ```powershell
   # Right-click PowerShell -> Run as Administrator
   .\deploy-windows.ps1
   ```

3. **Edit .env file** with your credentials

4. **Run initial import (one-time):**
   ```powershell
   node dist/main.js
   # In another terminal:
   npm run initial-import
   ```

5. **Start application:**
   ```powershell
   node dist/main.js
   ```

## Prerequisites

- **Node.js 18+** - Download from https://nodejs.org/
- **PostgreSQL** - Running and accessible
- **Redis** - Running and accessible (or use cloud Redis)

## Configuration

Edit `.env` file with:
- Database connection string
- CRM credentials
- Finance (Siagh) credentials
- Redis connection

## Running as Windows Service

Install PM2 Windows Service:

```powershell
npm install -g pm2 pm2-windows-service
pm2-service-install
pm2 start dist/main.js --name siaghsync
pm2 save
```

## Troubleshooting

- Check logs in application output
- Verify database connection
- Check Redis connection
- Review .env configuration
EOF

# Create archive
echo -e "${YELLOW}📦 Creating deployment archive...${NC}"
ARCHIVE_NAME="siaghsync-deployment-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$ARCHIVE_NAME" -C "$DEPLOY_DIR" .

echo ""
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo -e "${GREEN}📦 Deployment package created:${NC}"
echo -e "   Directory: ${YELLOW}$DEPLOY_DIR${NC}"
echo -e "   Archive:   ${YELLOW}$ARCHIVE_NAME${NC}"
echo ""
echo -e "${GREEN}📋 Next steps:${NC}"
echo -e "   1. Copy ${YELLOW}$DEPLOY_DIR${NC} folder to Windows server"
echo -e "   2. Or transfer ${YELLOW}$ARCHIVE_NAME${NC} and extract on Windows"
echo -e "   3. On Windows server, run: ${YELLOW}deploy-windows.ps1${NC}"
echo ""

