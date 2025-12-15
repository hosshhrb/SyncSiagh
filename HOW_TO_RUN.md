# How to Run and See Logs

Simple step-by-step guide.

---

## ⚡ Quick Steps

### 1. Configure

```bash
# Copy example config
cp .env.example .env

# Edit with your credentials
nano .env
```

**Important:** Hash your Siagh password first:
```bash
npm run hash-password your-password
# Copy the output to FINANCE_PASSWORD in .env
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

### 3. Setup Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Test APIs

```bash
npm run check-apis
```

### 5. Run Application (See Logs)

```bash
npm run start:dev
```

**That's it!** Logs will appear in the console.

---

## 📊 Viewing Logs

### Real-Time Console Logs

```bash
npm run start:dev
```

**You'll see:**
- ✅ Database connected
- ✅ CRM authenticated
- ✅ Finance authenticated
- 🔄 Sync operations
- 📨 Webhook events
- ⚠️ Errors (if any)

### Database Logs (Sync History)

```bash
npm run prisma:studio
```

Opens browser - view **SyncLog** table for all sync operations.

### PM2 Logs (Production)

```bash
pm2 start dist/main.js --name siaghsync
pm2 logs siaghsync
```

---

## 🧪 Test It

```bash
# 1. Test connectivity
npm run check-apis

# 2. Run initial import (one-time)
npm run initial-import

# 3. Start and watch logs
npm run start:dev
```

---

## 📝 Configuration Values

Based on your Siagh docs:

```bash
# Siagh Finance
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="MD5_HASH_HERE"  # Use: npm run hash-password
```

See [CONFIG_REFERENCE.md](CONFIG_REFERENCE.md) for complete configuration.

---

## 🆘 Quick Help

**No logs?** Check if app is running: `curl http://localhost:3000/health`

**Can't connect?** Run: `npm run check-apis`

**See database logs:** `npm run prisma:studio`

---

**Start with:** `npm run start:dev` and watch the console! 🚀

