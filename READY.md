# ✅ Ready to Run!

Everything is set up and ready.

## Current Status

```
✅ PostgreSQL running (port 5432)
✅ Redis running (port 6379)
✅ Database schema created
✅ Finance API configured (http://172.16.16.15)
⚠️  CRM credentials need configuration
```

---

## Configure CRM (1 minute)

```bash
nano .env
```

Change these two lines:
```bash
CRM_USERNAME="your-actual-username"
CRM_PASSWORD="your-actual-password"
```

Save and exit (Ctrl+X, Y, Enter).

---

## Run and See Logs

```bash
npm run start:dev
```

Logs will show in the console:
- Database connection
- API authentication
- Sync operations
- Everything in real-time

---

## Quick Commands

```bash
# Check status
npm run status

# Test APIs
npm run check-apis

# Run with logs
npm run start:dev

# View database logs
npm run prisma:studio
```

---

## Configuration (Already Done)

Your `.env` has Siagh Finance configured from the docs you provided:

```bash
FINANCE_API_BASE_URL="http://172.16.16.15"
FINANCE_USERNAME="مدیر سیستم"
FINANCE_PASSWORD="92C0ED8C3EC1DD67D834D3005A592A80"
```

Just add your CRM credentials and you're ready!

---

**Start with:** `npm run start:dev` 🚀
