# Configuration Reference

Based on your Siagh Finance API documentation.

---

## 📝 .env Configuration

Create `.env` file with these values:

```bash
# ============================================
# Database
# ============================================
DATABASE_URL="postgresql://siagh_user:siagh_pass@localhost:5432/siagh_sync"

# ============================================
# Redis
# ============================================
REDIS_HOST="localhost"
REDIS_PORT=6379

# ============================================
# CRM System (Payamgostar)
# ============================================
CRM_API_BASE_URL="https://crm.payamgostar.com"
CRM_USERNAME="your-username"
CRM_PASSWORD="your-password"

# ============================================
# Finance System (Siagh)
# Based on your API documentation
# ============================================
# Base URL from your docs: http://172.16.16.15
FINANCE_API_BASE_URL="http://172.16.16.15"

# Username from your docs: "مدیر سیستم"
FINANCE_USERNAME="مدیر سیستم"

# Password MUST be MD5 hashed!
# From your docs example: "92C0ED8C3EC1DD67D834D3005A592A80"
# To hash your password:
#   npm run hash-password your-actual-password
#   OR
#   echo -n "your-password" | md5sum | tr '[:lower:]' '[:upper:]'
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"

# ============================================
# Webhook Configuration
# ============================================
WEBHOOK_SECRET="change-this-to-a-secure-random-string"
WEBHOOK_BASE_URL="http://localhost:3000"

# ============================================
# Sync Settings
# ============================================
POLL_INTERVAL_SECONDS=300
MAX_RETRY_ATTEMPTS=3
ENABLE_WEBHOOKS=false

# ============================================
# Application
# ============================================
PORT=3000
NODE_ENV=development
```

---

## 🔑 Key Configuration Notes

### Siagh Finance API

**Base URL:**
- From your docs: `http://172.16.16.15`
- No `/api` suffix needed
- Use `http://` not `https://` (unless your server uses SSL)

**Login Endpoint:**
- `POST /GeneralApi/LoginUser`
- Returns `SessionId` which is used for authentication

**Authentication:**
- Username: `"مدیر سیستم"` (from your docs)
- Password: Must be MD5 hashed
- Example hash from docs: `92C0ED8C3EC1DD67D834D3005A592A80`

**Hash Your Password:**
```bash
npm run hash-password your-actual-password
# Copy the output to FINANCE_PASSWORD in .env
```

### CRM (Payamgostar)

**Base URL:**
- `https://crm.payamgostar.com`
- No `/api` suffix (it's added in code)

**Login Endpoint:**
- `POST /api/v2/auth/login`
- Returns `accessToken` for Bearer authentication

---

## 🚀 Quick Setup

```bash
# 1. Create .env file
cp .env.example .env

# 2. Edit .env with your values
nano .env

# 3. Hash Siagh password
npm run hash-password your-siagh-password
# Copy hash to FINANCE_PASSWORD in .env

# 4. Test configuration
npm run check-apis
```

---

## ✅ Verify Configuration

After setting up `.env`, test it:

```bash
npm run check-apis
```

**Expected output:**
```
🔍 Checking API connectivity...

📡 Testing CRM API...
   ✅ CRM token configured: abc123...
   ✅ Successfully fetched X customers

📡 Testing Finance API...
   Authenticating...
   ✅ Finance session obtained: xyz789...
   ✅ Successfully fetched X customers

✅ API connectivity check completed!
```

---

## 📚 See Also

- [QUICK_RUN.md](QUICK_RUN.md) - Fastest way to run
- [RUN_AND_TEST.md](RUN_AND_TEST.md) - Complete testing guide
- [SIAGH_SETUP.md](SIAGH_SETUP.md) - Siagh-specific setup

