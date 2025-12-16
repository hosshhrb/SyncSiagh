# API Check on Deployment

## ✅ Yes, you CAN run API check on deployment!

The deployment package now includes:
- ✅ Compiled check-apis script (`dist/scripts/check-apis.js`)
- ✅ Updated package.json with correct commands
- ✅ Batch file for easy execution

---

## How to Run API Check on Windows

### Method 1: Using npm (Recommended)

```powershell
cd C:\path\to\deployment
npm run check-apis
```

### Method 2: Using Batch File

```powershell
cd C:\path\to\deployment
.\check-apis.bat
```

### Method 3: Direct Node Command

```powershell
cd C:\path\to\deployment
node dist/scripts/check-apis.js
```

---

## What It Checks

The API check script verifies:

1. **Environment File**
   - ✅ `.env` file exists

2. **CRM API (Payamgostar)**
   - ✅ Connection to `http://172.16.16.16`
   - ✅ Login with `webservice` username
   - ✅ Access token retrieval

3. **Finance API (Siagh)**
   - ✅ Connection to `http://172.16.16.15`
   - ✅ Login with credentials
   - ✅ Session ID retrieval

4. **Database**
   - ✅ PostgreSQL connection (if DATABASE_URL is set)

5. **Redis**
   - ✅ Redis connection (optional, graceful failure)

---

## Expected Output

### Successful Connection:

```
🔍 Checking API connectivity...

✅ CRM Configuration:
   URL: http://172.16.16.16/api/v2/auth/login
   Username: webservice
   
✅ CRM token obtained: eyJhbGci...

✅ Finance Configuration:
   URL: http://172.16.16.15/GeneralApi/LoginUser
   Username: مدیر سیستم

✅ Finance session obtained: 5e311c4b...

✅ All API checks passed!
```

### Connection Issues:

```
❌ CRM API Error: Connection refused
   URL: http://172.16.16.16
   
Troubleshooting:
   - Check CRM server is running
   - Verify URL in .env
   - Check network connectivity
```

---

## Available Scripts in Deployment

After deployment, you can run:

| Script | Command | Description |
|--------|---------|-------------|
| **API Check** | `npm run check-apis` | Verify API connectivity |
| **Initial Import** | `npm run initial-import` | One-time Finance→CRM import |
| **Hash Password** | `npm run hash-password` | Generate MD5 hash for passwords |
| **Prisma Studio** | `npm run prisma:studio` | Database GUI |

---

## Troubleshooting

### Error: "ts-node not found"

This means package.json wasn't updated. Rebuild:
```bash
# On Linux
./scripts/build-for-production.sh
```

The build script now automatically updates scripts to use compiled JS.

### Error: "Cannot find module"

Install dependencies first:
```powershell
npm install --production
npx prisma generate
```

### Error: "ECONNREFUSED"

Check that the API servers are reachable from Windows:
```powershell
# Test CRM
curl http://172.16.16.16

# Test Finance
curl http://172.16.16.15
```

---

## Testing APIs Before Main Application

**Best Practice:** Run API check before starting the application:

```powershell
# 1. Deploy
.\deploy-windows.ps1

# 2. Check APIs
npm run check-apis

# 3. If successful, start application
node dist/src/main.js
```

---

**API check is now fully supported in deployment!** 🚀
