# Deploy to Server for Testing

Complete guide to deploy and run SiaghSync on a server for testing.

---

## 🎯 Quick Deployment (5 minutes)

### Option 1: Deploy to Same Machine (Linux)

If your server is Linux (like your development machine):

```bash
# 1. Build for production
./scripts/build-for-production.sh

# 2. Install production dependencies
cd deployment
npm ci --production

# 3. Generate Prisma client
npx prisma generate

# 4. Configure .env
cp .env.example .env
nano .env  # Edit with your credentials

# 5. Run migrations
npx prisma migrate deploy

# 6. Start application
node dist/main.js
```

### Option 2: Deploy to Windows Server

**On Linux (build):**
```bash
./scripts/build-for-production.sh
```

**Transfer to Windows:**
- Copy `deployment/` folder to Windows server
- Or transfer `siaghsync-deployment-*.tar.gz` archive

**On Windows Server:**
```powershell
# Right-click PowerShell -> Run as Administrator
.\deploy-windows.ps1
```

---

## 📦 Step-by-Step: Linux Server Deployment

### Step 1: Build Deployment Package

On your development machine (Linux):

```bash
cd /home/h/SiaghSync

# Build deployment package
./scripts/build-for-production.sh
```

This creates:
- `deployment/` folder - Ready to deploy
- `siaghsync-deployment-*.tar.gz` - Compressed archive

### Step 2: Transfer to Server

**Option A: Same Machine (Testing)**
```bash
# Just use the deployment folder directly
cd deployment
```

**Option B: Remote Linux Server (via SCP)**
```bash
# Transfer folder
scp -r deployment/ user@server:/opt/siaghsync/

# Or transfer archive
scp siaghsync-deployment-*.tar.gz user@server:/opt/
```

**Option C: Remote Windows Server**
```bash
# Transfer via SCP
scp -r deployment/ user@windows-server:/C:/SiaghSync/

# Or use network share, USB drive, etc.
```

### Step 3: Setup on Server

**On Linux Server:**
```bash
# 1. Navigate to deployment directory
cd /opt/siaghsync  # or wherever you copied it

# 2. Install production dependencies
npm ci --production

# 3. Generate Prisma client
npx prisma generate

# 4. Configure environment
cp .env.example .env
nano .env  # Edit with your credentials

# 5. Setup database (if not already done)
# Make sure PostgreSQL is running
docker ps | grep postgres

# 6. Run migrations
npx prisma migrate deploy

# 7. Start application
node dist/main.js
```

**On Windows Server:**
```powershell
# 1. Navigate to deployment directory
cd C:\SiaghSync

# 2. Run deployment script (as Administrator)
.\deploy-windows.ps1

# Follow the prompts - it will:
# - Install dependencies
# - Generate Prisma client
# - Create .env file
# - Run migrations
# - Optionally install PM2 service
```

---

## 🐳 Using Docker on Server (Recommended for Testing)

### Quick Docker Deployment

**On Linux Server:**

```bash
# 1. Copy entire project to server
scp -r /home/h/SiaghSync user@server:/opt/

# 2. On server, start everything
cd /opt/SiaghSync
docker compose up -d

# 3. Setup database
npm install
npm run prisma:generate
npm run prisma:migrate

# 4. Configure .env
cp .env.example .env
nano .env

# 5. Start application
npm run start:prod
```

**Or use Docker Compose for everything:**

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: siaghsync-app
    restart: unless-stopped
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:16-alpine
    container_name: siaghsync-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: siagh_user
      POSTGRES_PASSWORD: siagh_pass
      POSTGRES_DB: siagh_sync
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: siaghsync-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Then:
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## 🚀 Running on Server

### Development Mode (with logs)

```bash
# On Linux
npm run start:dev

# On Windows
npm run start:dev
```

**Logs appear in console** - perfect for testing!

### Production Mode

```bash
# On Linux
npm run start:prod

# Or with PM2 (recommended)
npm install -g pm2
pm2 start dist/main.js --name siaghsync
pm2 logs siaghsync
```

### Windows Service

```powershell
# Install PM2 as Windows Service
npm install -g pm2 pm2-windows-service
pm2-service-install

# Start application
pm2 start dist/main.js --name siaghsync
pm2 save

# View logs
pm2 logs siaghsync
```

---

## 📊 Viewing Logs on Server

### Real-Time Console Logs

```bash
# Development mode
npm run start:dev

# Production mode
node dist/main.js
```

### PM2 Logs

```bash
# View logs
pm2 logs siaghsync

# Follow logs
pm2 logs siaghsync --lines 0

# Save to file
pm2 logs siaghsync --out /var/log/siaghsync.log
```

### Docker Logs

```bash
# Application logs
docker logs siaghsync-app -f

# Database logs
docker logs siaghsync-postgres -f

# All services
docker compose logs -f
```

### Database Logs (Sync History)

```bash
# Open Prisma Studio
npm run prisma:studio

# Or query directly
psql -U siagh_user -d siagh_sync
SELECT * FROM "SyncLog" ORDER BY "startedAt" DESC LIMIT 10;
```

---

## 🧪 Testing on Server

### 1. Test API Connectivity

```bash
npm run check-apis
```

**Expected output:**
```
✅ Database connected
✅ CRM token configured
✅ Finance session obtained
✅ API connectivity check completed!
```

### 2. Test Application Health

```bash
# Start application
npm run start:dev

# In another terminal, test health endpoint
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-15T12:00:00.000Z",
  "service": "SiaghSync"
}
```

### 3. Run Initial Import

```bash
# One-time import from Finance to CRM
npm run initial-import
```

### 4. Monitor Sync Operations

```bash
# Watch logs in real-time
npm run start:dev

# Or check database
npm run prisma:studio
# Navigate to SyncLog table
```

---

## 🔧 Server Configuration

### Environment Variables (.env)

**Required for server:**
```bash
# Database (use server's PostgreSQL)
DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"

# Redis (use server's Redis)
REDIS_HOST="localhost"
REDIS_PORT=6379

# CRM (your actual credentials)
CRM_API_BASE_URL="https://crm.payamgostar.com"
CRM_USERNAME="your-username"
CRM_PASSWORD="your-password"

# Finance (Siagh) - from your docs
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="MD5_HASH_HERE"

# Application
PORT=3000
NODE_ENV=production
```

### Firewall Rules

**Linux (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

**Linux (ufw):**
```bash
sudo ufw allow 3000/tcp
```

**Windows:**
- Open Windows Firewall
- Add inbound rule for port 3000

---

## 📝 Quick Server Test Checklist

- [ ] Server has Node.js 18+ installed
- [ ] PostgreSQL running (or accessible)
- [ ] Redis running (or accessible)
- [ ] Deployment package transferred
- [ ] Dependencies installed (`npm ci --production`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] `.env` configured with credentials
- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Application starts (`node dist/main.js`)
- [ ] Health endpoint responds (`curl http://localhost:3000/health`)
- [ ] APIs connect (`npm run check-apis`)
- [ ] Logs visible in console

---

## 🎯 Recommended Testing Flow

### 1. Initial Setup (One Time)

```bash
# On server
cd /opt/siaghsync  # or your deployment directory

# Install and setup
npm ci --production
npx prisma generate
cp .env.example .env
nano .env  # Configure credentials
npx prisma migrate deploy
```

### 2. Test APIs

```bash
npm run check-apis
```

### 3. Run Initial Import

```bash
npm run initial-import
```

### 4. Start Application (with logs)

```bash
npm run start:dev
```

**Watch the console for:**
- ✅ Database connected
- ✅ CRM authenticated
- ✅ Finance authenticated
- 🔄 Sync operations
- 📨 Webhook events

### 5. Monitor

```bash
# In another terminal
npm run prisma:studio
# View SyncLog table for sync history
```

---

## 🔄 Updating on Server

### Quick Update

```bash
# 1. Stop application
pm2 stop siaghsync  # or Ctrl+C if running manually

# 2. Pull new deployment package
# (transfer new deployment folder)

# 3. Install dependencies
npm ci --production

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations (if any)
npx prisma migrate deploy

# 6. Restart
pm2 restart siaghsync  # or node dist/main.js
```

---

## 🆘 Troubleshooting on Server

### Application Won't Start

```bash
# Check Node.js
node --version  # Should be 18+

# Check dependencies
npm ci --production

# Check .env
cat .env | grep -v PASSWORD

# Check database connection
npx prisma studio  # Should open browser

# Check logs
pm2 logs siaghsync --lines 50
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres
# or
systemctl status postgresql

# Test connection
psql -U siagh_user -d siagh_sync -h localhost

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Redis Connection Failed

```bash
# Check Redis is running
docker ps | grep redis
# or
redis-cli ping  # Should return PONG

# Check REDIS_HOST in .env
cat .env | grep REDIS
```

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000  # Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change PORT in .env
```

---

## 📚 Quick Reference

**Build deployment:**
```bash
./scripts/build-for-production.sh
```

**Deploy on Linux:**
```bash
cd deployment
npm ci --production
npx prisma generate
nano .env
npx prisma migrate deploy
node dist/main.js
```

**Deploy on Windows:**
```powershell
.\deploy-windows.ps1
```

**Run with logs:**
```bash
npm run start:dev
```

**View database logs:**
```bash
npm run prisma:studio
```

---

**Ready to test on server!** 🚀

Start with: `npm run start:dev` to see all logs in real-time.

