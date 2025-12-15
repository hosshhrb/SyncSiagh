# First-Time Setup Guide

Quick setup to get SiaghSync running and see logs.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Create .env File

```bash
# Copy example
cp .env.example .env

# Edit with your credentials
nano .env
```

**Required values:**
- `DATABASE_URL` - PostgreSQL connection string
- `CRM_USERNAME` and `CRM_PASSWORD` - Your CRM credentials
- `FINANCE_USERNAME` and `FINANCE_PASSWORD` - Your Siagh credentials (password must be MD5 hashed)

### Step 2: Hash Siagh Password

```bash
npm run hash-password your-actual-password
# Copy the output to FINANCE_PASSWORD in .env
```

### Step 3: Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify they're running
docker-compose ps
```

### Step 4: Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Step 5: Test APIs

```bash
npm run check-apis
```

### Step 6: Run Application

```bash
npm run start:dev
```

**Logs will appear in the console!**

---

## 🔧 Troubleshooting

### Error: "DATABASE_URL not found"

**Solution:**
```bash
# Make sure .env exists
cp .env.example .env

# Edit .env and set DATABASE_URL
nano .env
```

### Error: "Redis connection refused"

**Solution:**
```bash
# Start Redis
docker-compose up -d redis

# Or manually
docker run -d -p 6379:6379 redis
```

### Error: "Prisma client not generated"

**Solution:**
```bash
npm run prisma:generate
```

### Error: "Database connection failed"

**Solution:**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Check if it's running
docker-compose ps
```

---

## 📝 Configuration Checklist

- [ ] `.env` file created from `.env.example`
- [ ] `DATABASE_URL` set in `.env`
- [ ] `CRM_USERNAME` and `CRM_PASSWORD` set
- [ ] `FINANCE_USERNAME` set
- [ ] `FINANCE_PASSWORD` set (MD5 hashed)
- [ ] PostgreSQL running (`docker-compose up -d postgres`)
- [ ] Redis running (`docker-compose up -d redis`)
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Database migrated (`npm run prisma:migrate`)

---

## 🚀 Next Steps

After setup:
1. Test APIs: `npm run check-apis`
2. Run initial import: `npm run initial-import`
3. Start application: `npm run start:dev`
4. View logs in console

See [HOW_TO_RUN.md](HOW_TO_RUN.md) for more details.

