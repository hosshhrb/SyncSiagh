# ⚡ Quick Start - Everything is Ready!

Docker and database are set up. Just configure your credentials and run.

---

## Step 1: Configure CRM Credentials (Required)

```bash
nano .env
```

Change these lines:
```bash
CRM_USERNAME="your-actual-username"  # ← Your CRM username
CRM_PASSWORD="your-actual-password"  # ← Your CRM password
```

**Finance (Siagh) is already configured** from your docs:
- URL: `http://172.16.16.15`
- Username: `مدیر سیستم`
- Password: Already MD5 hashed

---

## Step 2: Run and See Logs

```bash
npm run start:dev
```

**Logs appear in the console!**

---

## That's it!

Everything else is ready:
- ✅ PostgreSQL running on port 5432
- ✅ Redis running on port 6379
- ✅ Database schema created
- ✅ Finance API configured

Just add your CRM credentials and run!

---

## Quick Commands

```bash
# Test APIs
npm run check-apis

# Run with logs (recommended)
npm run start:dev

# View database logs
npm run prisma:studio

# Initial import from Finance to CRM
npm run initial-import
```

---

See `SETUP_COMPLETE.md` for more details.

