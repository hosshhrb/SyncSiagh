# 🪟 Start on Windows - Step by Step

## ✅ Prerequisites

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running (or remote access)
- [ ] Redis running (or remote access)
- [ ] Deployment files copied to Windows

---

## 📝 Step-by-Step

### 1. Install Node.js (if not installed)

1. Go to: https://nodejs.org/
2. Download LTS version
3. Install with default options
4. Verify:
   ```powershell
   node --version
   ```

### 2. Copy Files to Windows

From your Linux machine:
```bash
./scripts/build-for-production.sh
# Copy deployment/ folder to Windows (C:\SiaghSync)
```

### 3. Open PowerShell as Administrator

- Press `Win + X`
- Select **"Windows PowerShell (Admin)"**

### 4. Navigate to Folder

```powershell
cd C:\SiaghSync
```

### 5. Run Deployment Script

```powershell
.\deploy-windows.ps1
```

**Follow the prompts:**
- ✅ Checks Node.js
- ✅ Installs dependencies
- ✅ Generates Prisma client
- ✅ Creates .env file

### 6. Edit Configuration

```powershell
notepad .env
```

**Change:**
```bash
CRM_USERNAME="your-actual-username"
CRM_PASSWORD="your-actual-password"
```

**Save and close.**

### 7. Setup Database

```powershell
# Make sure PostgreSQL is running
# Then run migrations
npx prisma migrate deploy
```

### 8. Test APIs

```powershell
npm run check-apis
```

### 9. Run Application

```powershell
node dist/main.js
```

**Logs appear in console!**

---

## 📊 What You'll See

```
✅ Database connected
✅ Successfully authenticated with Payamgostar CRM
✅ Successfully authenticated with Siagh Finance API
🚀 SiaghSync is running on: http://localhost:3000
```

---

## 🔄 Run as Service (Optional)

```powershell
# Install PM2
npm install -g pm2 pm2-windows-service

# Install as Windows Service
pm2-service-install

# Start
pm2 start dist/main.js --name siaghsync
pm2 save

# View logs
pm2 logs siaghsync
```

---

## 🆘 Quick Fixes

**Won't start?**
```powershell
npm ci --production
npx prisma generate
```

**Database error?**
```powershell
# Check PostgreSQL is running
Get-Service postgresql*
```

**Port in use?**
```powershell
# Change PORT in .env
# Or kill process using port 3000
```

---

**Start with:** `node dist/main.js` 🚀
