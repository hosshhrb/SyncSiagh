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

# Copy compiled scripts (check-apis, initial-import, etc.)
if [ -d "dist/scripts" ]; then
    echo -e "${GREEN}   ✅ Compiled scripts included${NC}"
else
    echo -e "${YELLOW}   ⚠️  No compiled scripts found${NC}"
fi

# Update package.json scripts to use compiled JS instead of ts-node
echo -e "${YELLOW}   Updating package.json scripts for production...${NC}"
cd "$DEPLOY_DIR"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
// Update scripts to use compiled JS files
pkg.scripts['check-apis'] = 'node dist/scripts/check-apis.js';
pkg.scripts['initial-import'] = 'node dist/scripts/initial-import.js';
pkg.scripts['hash-password'] = 'node dist/scripts/hash-password.js';
pkg.scripts['test-sync'] = 'node dist/scripts/test-sync.js';
pkg.scripts['test-all-apis'] = 'node dist/scripts/test-all-apis.js';
pkg.scripts['view-webhooks'] = 'node dist/scripts/view-webhook-logs.js';
pkg.scripts['view-failed'] = 'node dist/scripts/view-webhook-logs.js --failed';
pkg.scripts['view-pending'] = 'node dist/scripts/view-webhook-logs.js --pending';
pkg.scripts['check-db'] = 'node dist/scripts/check-database.js';
// Remove dev-only scripts
delete pkg.scripts['test'];
delete pkg.scripts['status'];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('   ✅ Scripts updated for production');
"
cd ..

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

# Copy the deployment scripts
cp scripts/deploy-windows.ps1 "$DEPLOY_DIR/deploy-windows.ps1"
cp scripts/update.ps1 "$DEPLOY_DIR/update.ps1"

# Copy migration scripts
echo -e "${YELLOW}   Copying migration helper scripts...${NC}"
if [ -d "templates/deployment-helpers" ]; then
    cp templates/deployment-helpers/run-migrations.ps1 "$DEPLOY_DIR/" 2>/dev/null && \
        echo -e "${GREEN}   ✅ run-migrations.ps1 included${NC}"
    cp templates/deployment-helpers/run-migrations.bat "$DEPLOY_DIR/" 2>/dev/null && \
        echo -e "${GREEN}   ✅ run-migrations.bat included${NC}"
    cp templates/deployment-helpers/fix-db-permissions.sql "$DEPLOY_DIR/" 2>/dev/null && \
        echo -e "${GREEN}   ✅ fix-db-permissions.sql included${NC}"
    cp templates/deployment-helpers/MIGRATION-README.md "$DEPLOY_DIR/" 2>/dev/null && \
        echo -e "${GREEN}   ✅ MIGRATION-README.md included${NC}"
else
    echo -e "${YELLOW}   ⚠️  Migration helper scripts not found (templates/deployment-helpers)${NC}"
fi

# Create Windows batch file for easy start
cat > "$DEPLOY_DIR/start.bat" << 'EOF'
@echo off
echo Starting SiaghSync...
node dist/src/main.js
pause
EOF

# Create Windows batch file for PM2
cat > "$DEPLOY_DIR/start-pm2.bat" << 'EOF'
@echo off
echo Starting SiaghSync with PM2...
pm2 start dist/src/main.js --name siaghsync
pm2 save
pm2 monit
pause
EOF

# Create README for deployment
cat > "$DEPLOY_DIR/DEPLOYMENT-README.md" << 'EOF'
# SiaghSync Windows Deployment Guide

## Quick Start

### First-Time Setup

1. **Copy this entire folder to Windows server**

2. **Run deployment script:**
   ```powershell
   # Right-click PowerShell -> Run as Administrator
   .\deploy-windows.ps1
   ```

3. **Edit .env file** with your credentials

4. **Run database migrations:**
   ```batch
   run-migrations.bat fix
   ```

   If you get "permission denied" error, see `MIGRATION-README.md` for detailed fix instructions.

5. **Check API connectivity:**
   ```powershell
   npm run check-apis
   ```

6. **Test all APIs (optional - comprehensive test):**
   ```powershell
   npm run test-all-apis
   # This will:
   # - Test CRM and Finance authentication
   # - Test customer/contact creation
   # - Import 2 sample contacts
   # - Log everything to logs/api-test-[timestamp].log
   ```

7. **Run initial import (one-time):**
   ```powershell
   node dist/src/main.js
   # In another terminal:
   npm run initial-import
   ```

8. **Start application:**
   ```powershell
   node dist/src/main.js
   # Or with PM2:
   pm2 start dist/src/main.js --name siaghsync
   pm2 save
   ```

### Updating After Code Changes

When you receive updated files:

1. **Transfer new files** to this directory (overwrite existing files)

2. **Run update script:**
   ```powershell
   # Right-click PowerShell -> Run as Administrator
   .\update.ps1
   ```

   **Options:**
   - `.\update.ps1` - Interactive update (will ask about migrations)
   - `.\update.ps1 -CheckAPIs` - Update and check APIs
   - `.\update.ps1 -CheckAPIs -Restart` - Update, check APIs, and restart automatically

The update script will:
- Stop the application (if running with PM2)
- Install new dependencies
- Regenerate Prisma client
- **Ask about migrations** (only needed when database schema changes)
- Check APIs (if -CheckAPIs flag used)
- Restart the application

**Note:** For this update (code fixes only), you can skip migrations when prompted.
Database migrations are only needed when the Prisma schema changes.

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
pm2 start dist/src/main.js --name siaghsync
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

