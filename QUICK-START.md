# SiaghSync Deployment Quick Start

## Overview

This guide covers the deployment workflow for SiaghSync from your Linux development machine to your Windows server.

## Deployment Workflow

### Step 1: Build on Linux (Fedora)

Run the quick deployment script:

```bash
./scripts/quick-deploy.sh
```

This will:
- Install dependencies
- Build TypeScript to JavaScript
- Copy all necessary files to `deployment/` folder
- Create a deployment archive
- Update package.json scripts to use compiled code

### Step 2: Transfer to Windows Server

Transfer the `deployment` folder to your Windows server:

**Option A: Using SCP** (if you have SSH on Windows)
```bash
scp -r deployment/* adminapp@your-server:C:/Users/adminapp/SyncSiagh/deployment/
```

**Option B: Using file transfer tools**
- WinSCP
- FileZilla
- Or copy the `siaghsync-deployment-*.tar.gz` archive and extract on Windows

### Step 3: Setup on Windows Server

On your Windows server, open PowerShell as Administrator:

```powershell
cd C:\Users\adminapp\SyncSiagh\deployment
.\deploy-windows.ps1
```

**Options:**
- `.\deploy-windows.ps1` - Interactive mode (recommended for first setup)
- `.\deploy-windows.ps1 -CheckAPIs` - Automatically run API check after setup
- `.\deploy-windows.ps1 -SkipPrompts` - Non-interactive mode for updates

The script will:
1. ✅ Check prerequisites (Node.js, npm)
2. ✅ Detect if this is a fresh install or update
3. ✅ Install production dependencies
4. ✅ Generate Prisma client
5. ✅ Check/create .env file
6. ✅ Run database migrations (optional)
7. ✅ Run API connectivity check (optional)
8. ✅ Setup as Windows Service with PM2 (optional)

### Step 4: Configure and Start

**First-time setup:**
1. Edit `.env` file with your credentials
2. Run API check: `npm run check-apis`
3. Run initial import: `npm run initial-import`
4. Start application: `node dist/src/main.js`

**Update workflow:**
1. Stop the application (if running)
2. Run `.\deploy-windows.ps1`
3. Restart the application

## Available Scripts on Windows

After deployment, you can run these scripts:

```powershell
npm run check-apis        # Test API connectivity
npm run initial-import    # One-time data import
npm run hash-password     # Generate password hash
npm run test-sync         # Test synchronization
node dist/src/main.js     # Start application
```

## Running as Windows Service

To run SiaghSync as a Windows service:

```powershell
# Install PM2 globally
npm install -g pm2 pm2-windows-service

# Install PM2 as Windows Service
pm2-service-install

# Start application
pm2 start dist/src/main.js --name siaghsync
pm2 save

# Useful PM2 commands
pm2 list                  # List all services
pm2 logs siaghsync        # View logs
pm2 monit                 # Monitor
pm2 restart siaghsync     # Restart
pm2 stop siaghsync        # Stop
```

## Updating After Code Changes

When you push new code and want to deploy:

1. **On Linux:**
   ```bash
   git pull origin main
   ./scripts/quick-deploy.sh
   ```

2. **Transfer to Windows** (as described in Step 2)

3. **On Windows (PowerShell as Administrator):**
   ```powershell
   cd C:\Users\adminapp\SyncSiagh\deployment

   # Use the update script (recommended)
   .\update.ps1

   # Or with API check
   .\update.ps1 -CheckAPIs

   # Or automatic restart
   .\update.ps1 -CheckAPIs -Restart
   ```

The update script will:
- ✅ Stop the application automatically (if running with PM2)
- ✅ Install/update dependencies
- ✅ Regenerate Prisma client
- ✅ Run migrations (optional)
- ✅ Check APIs (optional)
- ✅ Restart the application automatically

**Alternative: Manual update**
   ```powershell
   # Stop application
   pm2 stop siaghsync  # or Ctrl+C

   # Update dependencies
   npm ci --production
   npx prisma generate

   # Restart
   pm2 restart siaghsync
   ```

## Troubleshooting

### Module not found errors
The deployment script automatically installs dependencies. If you see module errors:
```powershell
npm ci --production
npx prisma generate
```

### Database connection issues
Check your `.env` file:
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Test connection: `npx prisma db pull`

### API connectivity issues
Run the API check:
```powershell
npm run check-apis
```
Verify credentials in `.env`:
- `CRM_BASE_URL`, `CRM_API_TOKEN`
- `SIAGH_BASE_URL`, `SIAGH_USERNAME`, `SIAGH_PASSWORD`

### Redis connection issues
Verify in `.env`:
- `REDIS_HOST` (default: localhost)
- `REDIS_PORT` (default: 6379)

Make sure Redis is running or use a cloud Redis service.

## Files Structure

```
deployment/
├── deploy-windows.ps1       # Windows deployment script
├── dist/                    # Compiled JavaScript
│   ├── src/                 # Main application
│   └── scripts/             # Utility scripts (compiled)
├── prisma/                  # Database schema and migrations
├── package.json             # Production package.json
├── package-lock.json        # Lock file for consistent installs
├── .env.example             # Example configuration
├── .env                     # Your configuration (create/edit this)
├── start.bat                # Simple start script
└── start-pm2.bat            # PM2 start script
```

## Quick Reference

| Task | Command |
|------|---------|
| Build on Linux | `./scripts/quick-deploy.sh` |
| First deploy on Windows | `.\deploy-windows.ps1` |
| Update on Windows | `.\update.ps1` |
| Update with API check | `.\update.ps1 -CheckAPIs -Restart` |
| Check APIs | `npm run check-apis` |
| Start app | `node dist/src/main.js` |
| Start with PM2 | `pm2 start dist/src/main.js --name siaghsync` |
| View logs | `pm2 logs siaghsync` |
| Restart service | `pm2 restart siaghsync` |

## Support

For issues or questions, check:
- `deployment/DEPLOYMENT-README.md` - Detailed deployment guide
- `.env.example` - Configuration reference
- Application logs - For runtime errors
