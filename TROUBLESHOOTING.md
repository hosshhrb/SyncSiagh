# Troubleshooting Guide

## Common Issues and Solutions

### Network Issues

#### Problem: `npm install` fails with `EAI_AGAIN` or DNS errors

**Symptoms:**
```
npm error code EAI_AGAIN
npm error syscall getaddrinfo
npm error errno EAI_AGAIN
npm error request to https://registry.npmjs.org/... failed
```

**Solutions:**

1. **Check internet connection**
   ```bash
   ping registry.npmjs.org
   ```

2. **Use different DNS servers**
   ```bash
   # Edit /etc/resolv.conf or use systemd-resolved
   # Try Google DNS: 8.8.8.8, 8.8.4.4
   ```

3. **Use npm registry mirror** (if in restricted network)
   ```bash
   npm config set registry https://registry.npmmirror.com
   # Or use corporate proxy
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

4. **Retry with longer timeout**
   ```bash
   npm install --fetch-timeout=60000
   ```

5. **Generate lock file when network is available**
   ```bash
   # When you have network access
   ./scripts/generate-lockfile.sh
   # Then commit package-lock.json
   ```

---

### Build Script Issues

#### Problem: `npm ci` fails - "package-lock.json not found"

**Symptoms:**
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**Solutions:**

1. **Generate package-lock.json first**
   ```bash
   ./scripts/generate-lockfile.sh
   ```

2. **Or use npm install instead** (build script now handles this automatically)
   ```bash
   npm install
   ```

3. **The build script now automatically falls back to `npm install` if lock file is missing**

---

### Missing package-lock.json

#### Problem: No package-lock.json in repository

**Why it's needed:**
- Ensures consistent dependency versions
- Faster installs with `npm ci`
- Better for production deployments

**Solution:**
```bash
# Generate lock file
./scripts/generate-lockfile.sh

# Commit to repository
git add package-lock.json
git commit -m "Add package-lock.json"
```

---

### Windows Deployment Issues

#### Problem: PowerShell script won't run

**Symptoms:**
```
Execution of scripts is disabled on this system
```

**Solution:**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Problem: Node.js not found on Windows

**Solution:**
1. Download and install Node.js from https://nodejs.org/
2. Restart PowerShell after installation
3. Verify: `node --version`

#### Problem: Prisma client generation fails

**Solution:**
```powershell
# Install Prisma CLI globally
npm install -g prisma

# Generate client
npx prisma generate

# Or reinstall dependencies
npm ci --production=false
npx prisma generate
```

---

### Database Connection Issues

#### Problem: Cannot connect to PostgreSQL

**Symptoms:**
```
Error: P1001: Can't reach database server
```

**Solutions:**

1. **Check PostgreSQL is running**
   ```bash
   # Linux
   sudo systemctl status postgresql
   
   # Windows
   Get-Service postgresql*
   ```

2. **Verify connection string in .env**
   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

3. **Test connection**
   ```bash
   # Linux
   psql -U user -d database -h host
   
   # Windows
   psql -U user -d database -h host
   ```

4. **Check firewall**
   - Allow port 5432 in firewall rules
   - Check if PostgreSQL is listening on correct interface

---

### Redis Connection Issues

#### Problem: Cannot connect to Redis

**Solutions:**

1. **Check Redis is running**
   ```bash
   # Linux
   redis-cli ping
   # Should return: PONG
   
   # Windows
   # Check if Redis service is running
   ```

2. **Use cloud Redis** (alternative)
   ```bash
   # Update .env
   REDIS_HOST=your-redis-cloud-host
   REDIS_PORT=6379
   # Or use connection string if supported
   ```

3. **Check firewall**
   - Allow port 6379 in firewall rules

---

### Authentication Issues

#### Problem: CRM authentication fails

**Symptoms:**
```
401 - Invalid credentials
403 - Too many attempts
```

**Solutions:**

1. **Verify credentials in .env**
   ```bash
   CRM_USERNAME="your-username"
   CRM_PASSWORD="your-password"
   ```

2. **Check for "Too many attempts" error**
   - Wait 15-30 minutes
   - Verify credentials are correct
   - Contact CRM admin if issue persists

3. **Test authentication manually**
   ```bash
   curl -X POST "https://crm.payamgostar.com/api/v2/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username":"your-username","password":"your-password"}'
   ```

#### Problem: Siagh authentication fails

**Solutions:**

1. **Verify password is MD5 hashed**
   ```bash
   npm run hash-password your-password
   # Copy the hash to .env
   ```

2. **Check credentials**
   ```bash
   FINANCE_USERNAME="مدیر سیستم"
   FINANCE_PASSWORD="MD5_HASH_HERE"
   ```

3. **Test connection**
   ```bash
   npm run check-apis
   ```

---

### Sync Issues

#### Problem: No syncs happening

**Solutions:**

1. **Check if initial import completed**
   ```bash
   npm run prisma:studio
   # Check EntityMapping table
   ```

2. **Verify webhooks are registered** (if using webhooks)
   ```bash
   # Check CRM webhook settings
   # Verify webhook URL is accessible
   ```

3. **Check polling is enabled** (if not using webhooks)
   ```bash
   # In .env
   ENABLE_WEBHOOKS=false
   # Polling runs every 5 minutes
   ```

4. **Check application logs**
   ```bash
   # If using PM2
   pm2 logs siaghsync
   
   # Or check console output
   ```

#### Problem: Duplicate customers created

**Solutions:**

1. **Verify customer number is set**
   - Check CRM customer has `code` field
   - Check Finance customer has `Code` field

2. **Run initial import again to link existing**
   ```bash
   npm run initial-import
   ```

3. **Check entity mappings**
   ```bash
   npm run prisma:studio
   # Review EntityMapping table
   ```

---

### Build and Deployment Issues

#### Problem: Build fails on Linux

**Solutions:**

1. **Check Node.js version**
   ```bash
   node --version  # Should be 18+
   ```

2. **Clear npm cache**
   ```bash
   npm cache clean --force
   ```

3. **Remove node_modules and reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check disk space**
   ```bash
   df -h
   ```

#### Problem: Deployment fails on Windows

**Solutions:**

1. **Run PowerShell as Administrator**
   - Right-click PowerShell
   - Select "Run as Administrator"

2. **Check execution policy**
   ```powershell
   Get-ExecutionPolicy
   # If Restricted, run:
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Verify all files transferred**
   ```powershell
   # Check deployment folder has:
   # - dist/
   # - package.json
   # - prisma/
   ```

---

### Performance Issues

#### Problem: Slow sync operations

**Solutions:**

1. **Check database indexes**
   ```sql
   -- Verify indexes exist
   SELECT * FROM pg_indexes WHERE tablename = 'EntityMapping';
   ```

2. **Check Redis performance**
   ```bash
   redis-cli --latency
   ```

3. **Reduce polling frequency** (if using polling)
   ```bash
   # In .env
   POLL_INTERVAL_SECONDS=600  # 10 minutes instead of 5
   ```

4. **Increase PM2 instances** (if using PM2)
   ```bash
   pm2 start dist/main.js -i 2 --name siaghsync
   ```

---

### Logging and Debugging

#### Enable verbose logging

**Solution:**
```bash
# In .env
NODE_ENV=development
LOG_LEVEL=debug
```

#### View detailed logs

**Solution:**
```bash
# Application logs
pm2 logs siaghsync --lines 100

# Database logs (Prisma Studio)
npm run prisma:studio

# Check sync logs in database
# Navigate to SyncLog table in Prisma Studio
```

---

## Getting Help

### Check Logs

1. **Application logs**
   ```bash
   pm2 logs siaghsync
   ```

2. **Database logs**
   ```bash
   npm run prisma:studio
   # Check SyncLog table
   ```

3. **System logs** (Linux)
   ```bash
   journalctl -u siaghsync -f
   ```

### Common Commands

```bash
# Check API connectivity
npm run check-apis

# Test database connection
npx prisma studio

# View sync statistics
# Open Prisma Studio -> SyncLog table

# Check entity mappings
# Open Prisma Studio -> EntityMapping table
```

### Useful Files

- **Logs:** Application console output or PM2 logs
- **Database:** Prisma Studio (`npm run prisma:studio`)
- **Configuration:** `.env` file
- **Documentation:** See README.md and other .md files

---

## Still Having Issues?

1. **Check all prerequisites are installed**
2. **Verify configuration in .env**
3. **Review application logs**
4. **Check database and Redis connections**
5. **Verify API credentials**
6. **Review this troubleshooting guide**
7. **Check related documentation files**

---

**Last Updated:** 2024-12-15

