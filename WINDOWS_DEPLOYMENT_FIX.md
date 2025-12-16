# Windows Deployment Script Fixed

## Issue
PowerShell parsing error: "The string is missing the terminator"

## Cause
- Encoding issues when file was transferred to Windows
- Possible smart quotes or special characters
- Line ending format mismatch

## Solution
The `deploy-windows.ps1` script has been recreated with:
- Clean ASCII encoding
- Proper Windows CRLF line endings
- All quotes are straight quotes (not smart quotes)
- Simplified emoji characters removed

## How to Update on Windows

### Option 1: Copy the new file
1. Re-run the build script on Linux:
   ```bash
   cd /home/h/SiaghSync
   ./scripts/build-for-production.sh
   ```

2. Copy the new `deployment/` folder to Windows again

### Option 2: Download directly
Copy the content from the fixed script and paste it into a new file on Windows.

## Running the Script

```powershell
# On Windows (PowerShell as Administrator)
cd C:\Users\adminapp\SyncSiagh\deployment
.\deploy-windows.ps1
```

## If You Still Get Errors

Try running PowerShell with execution policy bypass:
```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-windows.ps1
```

Or set execution policy permanently:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Manual Deployment Steps

If the script still doesn't work, run these commands manually:

```powershell
# 1. Install dependencies
npm install --production

# 2. Generate Prisma client
npx prisma generate

# 3. Check .env file exists
# (Copy from .env.example if needed)

# 4. Run migrations
npx prisma migrate deploy

# 5. Start application
node dist/src/main.js
```

## Key Changes in Fixed Script
- All emoji removed (simplified)
- All quotes verified as straight quotes
- Proper Windows line endings (CRLF)
- ASCII encoding (no UTF-8 special characters)
- Path fixed: `dist/src/main.js` instead of `dist/main.js`

---

**The script is now fixed and ready to use!**
