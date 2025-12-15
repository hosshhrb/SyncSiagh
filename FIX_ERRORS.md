# Fixing the Errors You're Seeing

Based on your terminal output, here's what to fix:

---

## ❌ Errors Found

1. **Redis connection refused** - Redis is not running
2. **DATABASE_URL not found** - .env file missing or not configured

---

## ✅ Quick Fix

### 1. Create .env File

```bash
# Already done - .env was created from .env.example
# Now edit it with your actual credentials:
nano .env
```

**Set these values:**
```bash
DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"
CRM_USERNAME="your-username"
CRM_PASSWORD="your-password"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="MD5_HASH_HERE"  # Use: npm run hash-password
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify they're running
docker-compose ps
```

**If docker-compose doesn't work, use docker directly:**
```bash
# Start PostgreSQL
docker run -d \
  --name siagh-postgres \
  -e POSTGRES_USER=siagh_user \
  -e POSTGRES_PASSWORD=siagh_pass \
  -e POSTGRES_DB=siagh_sync \
  -p 5432:5432 \
  postgres:15

# Start Redis
docker run -d \
  --name siagh-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 4. Test Again

```bash
npm run check-apis
```

---

## 📊 What the Fixed Script Does

The updated `check-apis.ts` script now:
- ✅ Checks if .env exists before running
- ✅ Validates DATABASE_URL is set
- ✅ Warns if Redis is not running (but continues)
- ✅ Shows clearer error messages

---

## 🚀 After Fixing

Once everything is set up:

```bash
# Test APIs
npm run check-apis

# Run application with logs
npm run start:dev
```

**You'll see logs like:**
```
✅ Database connected
✅ Successfully authenticated with Payamgostar CRM
✅ Successfully authenticated with Siagh Finance API
🚀 SiaghSync is running on: http://localhost:3000
```

---

## 📚 More Help

- [SETUP_FIRST.md](SETUP_FIRST.md) - Complete first-time setup
- [HOW_TO_RUN.md](HOW_TO_RUN.md) - How to run and see logs
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions

