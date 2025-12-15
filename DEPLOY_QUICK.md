# 🚀 Quick Deploy to Server

Fastest way to deploy and test on server.

---

## Same Machine (Linux) - 2 Minutes

```bash
# 1. Build
./scripts/build-for-production.sh

# 2. Setup
cd deployment
npm ci --production
npx prisma generate
cp .env.example .env
nano .env  # Add CRM credentials

# 3. Database
npx prisma migrate deploy

# 4. Run with logs
node dist/main.js
```

**Done!** Logs appear in console.

---

## Remote Linux Server

### Automated:
```bash
./scripts/deploy-to-server.sh user@server-ip
```

### Manual:
```bash
# 1. Build
./scripts/build-for-production.sh

# 2. Transfer
scp -r deployment/ user@server:/opt/siaghsync/

# 3. On server
ssh user@server
cd /opt/siaghsync
npm ci --production
npx prisma generate
cp .env.example .env
nano .env
npx prisma migrate deploy
node dist/main.js
```

---

## Windows Server

```bash
# 1. Build on Linux
./scripts/build-for-production.sh

# 2. Transfer deployment/ folder to Windows

# 3. On Windows (PowerShell as Admin)
.\deploy-windows.ps1
```

---

## See Logs

```bash
# Development mode (best for testing)
npm run start:dev

# Production mode
node dist/main.js

# With PM2
pm2 start dist/main.js --name siaghsync
pm2 logs siaghsync
```

---

## Test It

```bash
# Test APIs
npm run check-apis

# Test health
curl http://localhost:3000/health

# Run initial import
npm run initial-import

# View database logs
npm run prisma:studio
```

---

**That's it!** Start with `node dist/main.js` and watch the logs! 🚀

