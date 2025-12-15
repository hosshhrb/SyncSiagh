# Setup Complete! 🎉

Your SiaghSync environment is ready. Here's what was set up:

---

## ✅ What's Done

### 1. Docker Containers Running
```bash
✅ PostgreSQL - Port 5432
✅ Redis - Port 6379
✅ Database migrated and ready
```

Verify with:
```bash
docker ps
```

### 2. Environment File Created
`.env` file created with Siagh Finance configuration from your docs:
```bash
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"
```

### 3. Database Schema Created
All tables created:
- EntityMapping
- SyncLog
- WebhookSubscription
- SyncRetryQueue

---

## ⚙️ Configure Your Credentials

Edit `.env` file with your actual credentials:

```bash
nano .env
```

**Required changes:**

### CRM (Payamgostar)
```bash
CRM_USERNAME="your-actual-username"  # ← Change this
CRM_PASSWORD="your-actual-password"  # ← Change this
```

### Finance (Siagh) - Optional Changes
```bash
# If your Siagh server is different:
FINANCE_API_BASE_URL="http://YOUR_IP_HERE"

# If your username is different:
FINANCE_USERNAME="your-username"

# If your password is different, hash it first:
npm run hash-password your-new-password
# Then update:
FINANCE_PASSWORD="NEW_MD5_HASH_HERE"
```

---

## 🚀 How to Run and See Logs

### Simple way:
```bash
npm run start:dev
```

Logs will appear in the console showing:
- ✅ Database connected
- ✅ CRM authentication
- ✅ Finance authentication  
- 🔄 Sync operations
- 📨 Webhook events
- ⚠️ Errors

### Test APIs first:
```bash
npm run check-apis
```

### View database logs:
```bash
npm run prisma:studio
```
Opens browser - view `SyncLog` table for all sync history.

---

## 📊 What You'll See

**When you start the application:**
```
[Nest] Starting Nest application...
✅ Database connected
✅ Successfully authenticated with Payamgostar CRM
✅ Successfully authenticated with Siagh Finance API
🚀 SiaghSync is running on: http://localhost:3000
```

**During sync operations:**
```
🔄 Starting sync: CRM -> Finance | Customer abc-123
   Creating new Finance customer
✅ Successfully created Finance customer 12345
```

**Polling (every 5 minutes):**
```
🔄 Polling CRM for customer changes...
Found 3 updated customers
✅ Queued 3 customers for sync
```

---

## 🧪 Quick Test

```bash
# 1. Edit credentials
nano .env

# 2. Test APIs
npm run check-apis

# 3. Run with logs
npm run start:dev
```

---

## 🛠️ Docker Commands

```bash
# View running containers
docker ps

# View logs
docker logs siagh_sync_postgres
docker logs siagh_sync_redis

# Stop containers
docker stop siagh_sync_postgres siagh_sync_redis

# Start containers
docker start siagh_sync_postgres siagh_sync_redis

# Remove containers (data will be preserved in volumes)
docker rm siagh_sync_postgres siagh_sync_redis

# Recreate containers (if needed)
docker run -d --name siagh_sync_postgres \
  -e POSTGRES_USER=siagh_user \
  -e POSTGRES_PASSWORD=siagh_pass \
  -e POSTGRES_DB=siagh_sync \
  -p 5432:5432 \
  postgres:16-alpine
```

---

## 📝 Configuration Reference

Your `.env` is configured with:

**Finance (Siagh) - From your documentation:**
- URL: `http://172.16.16.15`
- Username: `مدیر سیستم`
- Password: MD5 hashed (example from docs)
- Login endpoint: `/GeneralApi/LoginUser`
- Contact API: `/api/Sgh/GEN/Gn_Web_Users/GetAll`
- SaveFormData: `/BpmsApi/SaveFormData`

**Database:**
- PostgreSQL 16
- Database: `siagh_sync`
- User: `siagh_user`
- Password: `siagh_pass`
- Port: `5432`

**Redis:**
- Port: `6379`

---

## 🎯 Next Steps

1. **Configure your CRM credentials** in `.env`
2. **Test APIs:** `npm run check-apis`
3. **Run initial import:** `npm run initial-import`
4. **Start application:** `npm run start:dev`
5. **Watch logs in console**

---

## 📚 Documentation

- `FIX_ERRORS.md` - Troubleshooting guide
- `HOW_TO_RUN.md` - How to run and see logs
- `CONFIG_REFERENCE.md` - Complete configuration reference
- `SETUP_FIRST.md` - First-time setup guide

---

**Ready to sync!** Just configure your CRM credentials and run: `npm run start:dev` 🚀

