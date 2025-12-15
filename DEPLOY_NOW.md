# ⚡ Deploy Now - 3 Steps

## Step 1: Build

```bash
./scripts/build-for-production.sh
```

## Step 2: Deploy

**Same machine:**
```bash
cd deployment
npm ci --production
npx prisma generate
cp .env.example .env
nano .env  # Add CRM credentials
npx prisma migrate deploy
```

**Remote server:**
```bash
# Transfer
scp -r deployment/ user@server:/opt/siaghsync/

# On server
cd /opt/siaghsync
npm ci --production
npx prisma generate
cp .env.example .env
nano .env
npx prisma migrate deploy
```

## Step 3: Run

```bash
node dist/main.js
```

**Logs appear in console!** ✅

---

## Windows Server

```bash
# Build on Linux
./scripts/build-for-production.sh

# Transfer deployment/ to Windows

# On Windows (PowerShell as Admin)
.\deploy-windows.ps1
```

---

**See logs:** `node dist/main.js`  
**Test APIs:** `npm run check-apis`  
**View database:** `npm run prisma:studio`
