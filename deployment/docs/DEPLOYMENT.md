# SiaghSync Deployment Guide

Complete guide for deploying SiaghSync from Linux (Fedora) development machine to Windows production server.

---

## 📋 Overview

**Development:** Linux Fedora  
**Production:** Windows Server  
**Deployment Method:** Build on Linux → Transfer → Deploy on Windows

---

## 🚀 Quick Deployment

### On Linux (Development Machine)

```bash
# 1. Build deployment package
./scripts/build-for-production.sh

# 2. Transfer to Windows server
# Option A: Copy folder
scp -r deployment/ user@windows-server:/path/to/siaghsync/

# Option B: Transfer archive
scp siaghsync-deployment-*.tar.gz user@windows-server:/path/to/
```

### On Windows Server

```powershell
# 1. Extract (if using archive)
tar -xzf siaghsync-deployment-*.tar.gz

# 2. Run deployment script (as Administrator)
# Right-click PowerShell -> Run as Administrator
.\deploy-windows.ps1

# 3. Edit .env with your credentials

# 4. Run initial import (one-time)
npm run initial-import

# 5. Start application
node dist/main.js
```

---

## 📦 Detailed Steps

### Step 1: Build on Linux

```bash
# Navigate to project directory
cd /path/to/SiaghSync

# Make script executable
chmod +x scripts/build-for-production.sh

# Run build script
./scripts/build-for-production.sh
```

**What it does:**
- Installs dependencies
- Builds TypeScript to JavaScript
- Creates deployment package with all necessary files
- Generates Windows deployment scripts
- Creates deployment archive

**Output:**
- `deployment/` folder - Ready to transfer
- `siaghsync-deployment-YYYYMMDD-HHMMSS.tar.gz` - Compressed archive

### Step 2: Transfer to Windows

**Option A: Using SCP (if SSH enabled)**
```bash
scp -r deployment/ user@windows-server:/C:/SiaghSync/
```

**Option B: Using SMB/Network Share**
```bash
# Mount Windows share
sudo mkdir /mnt/windows
sudo mount -t cifs //windows-server/share /mnt/windows -o username=user

# Copy files
cp -r deployment/* /mnt/windows/SiaghSync/
```

**Option C: Using USB Drive**
```bash
# Copy to USB
cp -r deployment/* /media/usb/SiaghSync/
```

**Option D: Using Archive**
```bash
# Create archive and transfer
scp siaghsync-deployment-*.tar.gz user@windows-server:/C:/SiaghSync/
```

### Step 3: Deploy on Windows

#### Prerequisites

1. **Install Node.js 18+**
   - Download from: https://nodejs.org/
   - Choose LTS version
   - Install with default options

2. **Install PostgreSQL** (if not using remote)
   - Download from: https://www.postgresql.org/download/windows/
   - Or use cloud PostgreSQL

3. **Install Redis** (if not using cloud)
   - Download from: https://github.com/microsoftarchive/redis/releases
   - Or use cloud Redis (Redis Cloud, AWS ElastiCache, etc.)

#### Deployment Steps

1. **Extract files** (if using archive)
   ```powershell
   # Using PowerShell
   tar -xzf siaghsync-deployment-*.tar.gz
   
   # Or use 7-Zip/WinRAR
   ```

2. **Run deployment script**
   ```powershell
   # Right-click PowerShell -> Run as Administrator
   cd C:\SiaghSync
   .\deploy-windows.ps1
   ```

   The script will:
   - Check Node.js installation
   - Install production dependencies
   - Generate Prisma client
   - Create .env file if missing
   - Optionally run database migrations
   - Optionally install PM2 service

3. **Configure environment**
   ```powershell
   # Edit .env file
   notepad .env
   ```

   Required settings:
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/siagh_sync"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   CRM_API_BASE_URL="https://crm.payamgostar.com"
   CRM_USERNAME="your-username"
   CRM_PASSWORD="your-password"
   FINANCE_API_BASE_URL="http://172.16.16.15"
   FINANCE_USERNAME="مدیر سیستم"
   FINANCE_PASSWORD="MD5_HASH_HERE"
   ```

4. **Run database migrations**
   ```powershell
   npx prisma migrate deploy
   ```

5. **Run initial import** (one-time)
   ```powershell
   npm run initial-import
   ```

6. **Start application**
   ```powershell
   # Manual start
   node dist/main.js
   
   # Or with PM2 (recommended for production)
   pm2 start dist/main.js --name siaghsync
   pm2 save
   ```

---

## 🔧 Running as Windows Service

### Using PM2 (Recommended)

```powershell
# Install PM2 globally
npm install -g pm2 pm2-windows-service

# Install PM2 as Windows Service
pm2-service-install

# Start application
pm2 start dist/main.js --name siaghsync

# Save configuration
pm2 save

# View logs
pm2 logs siaghsync

# Monitor
pm2 monit

# Stop
pm2 stop siaghsync

# Restart
pm2 restart siaghsync
```

### Using NSSM (Alternative)

```powershell
# Download NSSM from https://nssm.cc/download
# Extract to C:\nssm

# Install service
C:\nssm\win64\nssm.exe install SiaghSync
# In GUI:
#   Path: C:\Program Files\nodejs\node.exe
#   Startup directory: C:\SiaghSync
#   Arguments: dist/main.js

# Start service
C:\nssm\win64\nssm.exe start SiaghSync
```

---

## 📁 Deployment Package Structure

```
deployment/
├── dist/                    # Compiled JavaScript
├── prisma/                  # Prisma schema and migrations
├── node_modules/            # Production dependencies
├── package.json             # Dependencies list
├── .env                     # Configuration (from .env.production)
├── .env.example             # Example configuration
├── deploy-windows.ps1       # Windows deployment script
├── start.bat                # Simple start script
├── start-pm2.bat            # PM2 start script
└── DEPLOYMENT-README.md     # Quick reference
```

---

## 🔍 Verification

### Check Application

```powershell
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"...","service":"SiaghSync"}
```

### Check Logs

```powershell
# If using PM2
pm2 logs siaghsync

# If running manually
# Logs appear in console
```

### Check Database

```powershell
# Open Prisma Studio
npm run prisma:studio

# Or connect with psql
psql -U siagh_user -d siagh_sync
```

---

## 🔄 Updates and Maintenance

### Update Application

```bash
# On Linux (development)
./scripts/build-for-production.sh

# Transfer new deployment package to Windows

# On Windows (production)
# Stop application
pm2 stop siaghsync

# Backup current deployment
xcopy /E /I deployment deployment-backup

# Extract new deployment
tar -xzf siaghsync-deployment-*.tar.gz

# Install dependencies
npm ci --production

# Generate Prisma client
npx prisma generate

# Run migrations (if any)
npx prisma migrate deploy

# Restart application
pm2 restart siaghsync
```

### Backup

```powershell
# Backup database
pg_dump -U siagh_user siagh_sync > backup.sql

# Backup .env
copy .env .env.backup

# Backup entity mappings (via Prisma Studio export)
```

---

## 🐛 Troubleshooting

### Application Won't Start

1. **Check Node.js version**
   ```powershell
   node --version  # Should be 18+
   ```

2. **Check dependencies**
   ```powershell
   npm ci --production
   ```

3. **Check .env file**
   ```powershell
   # Verify all required variables are set
   Get-Content .env
   ```

4. **Check database connection**
   ```powershell
   npx prisma studio
   # If fails, check DATABASE_URL
   ```

5. **Check logs**
   ```powershell
   # If using PM2
   pm2 logs siaghsync --lines 100
   ```

### Database Connection Issues

1. **Verify PostgreSQL is running**
   ```powershell
   # Check service
   Get-Service postgresql*
   ```

2. **Test connection**
   ```powershell
   psql -U siagh_user -d siagh_sync -h localhost
   ```

3. **Check firewall**
   - Allow PostgreSQL port (5432) in Windows Firewall

### Redis Connection Issues

1. **Verify Redis is running**
   ```powershell
   # Check if Redis is listening
   netstat -an | findstr 6379
   ```

2. **Test connection**
   ```powershell
   # Use redis-cli if installed
   redis-cli ping
   # Should return: PONG
   ```

3. **Use cloud Redis** (alternative)
   - Update REDIS_HOST and REDIS_PORT in .env
   - Or use connection string format

### Permission Issues

1. **Run PowerShell as Administrator**
   - Right-click PowerShell
   - Select "Run as Administrator"

2. **Check file permissions**
   ```powershell
   # Ensure you have read/write access
   icacls deployment
   ```

### Port Already in Use

```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

## 📊 Monitoring

### Application Health

```powershell
# Health check endpoint
curl http://localhost:3000/health

# Check PM2 status
pm2 status

# Monitor resources
pm2 monit
```

### Database Monitoring

```powershell
# Open Prisma Studio
npm run prisma:studio

# View sync logs
# Navigate to SyncLog table
```

### Log Files

```powershell
# PM2 logs
pm2 logs siaghsync

# Save logs to file
pm2 logs siaghsync --out siaghsync.log
```

---

## 🔐 Security Checklist

- [ ] Change default database passwords
- [ ] Use strong passwords for CRM and Finance APIs
- [ ] Enable Windows Firewall
- [ ] Use HTTPS for webhooks (if exposed)
- [ ] Restrict database access
- [ ] Use environment variables (never commit .env)
- [ ] Regular backups
- [ ] Update Node.js and dependencies regularly
- [ ] Monitor logs for suspicious activity

---

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs siaghsync`
2. Review this guide
3. Check application logs in console
4. Verify all prerequisites are installed
5. Test database and Redis connections

---

## 📚 Related Documentation

- [SETUP.md](SETUP.md) - General setup guide
- [QUICKSTART.md](QUICKSTART.md) - Quick start commands
- [SYNC_STRATEGY.md](SYNC_STRATEGY.md) - Sync strategy details
- [SIAGH_SETUP.md](SIAGH_SETUP.md) - Siagh configuration

---

**Ready to deploy!** 🚀

