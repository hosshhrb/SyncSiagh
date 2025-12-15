# Quick Setup Guide for Siagh Integration

## 🚀 Fast Track Setup

### Step 1: Hash Your Password

Siagh requires MD5 hashed passwords. Run:

```bash
npm run hash-password your-password
```

Or:

```bash
echo -n "your-password" | md5sum | tr '[:lower:]' '[:upper:]'
```

Copy the output hash.

### Step 2: Configure .env

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Siagh Finance System
FINANCE_API_BASE_URL="http://172.16.16.15"  # Your Siagh server IP
FINANCE_USERNAME="مدیر سیستم"               # Your Siagh username
FINANCE_PASSWORD="PASTE_YOUR_HASH_HERE"     # MD5 hash from Step 1
```

### Step 3: Test Connection

```bash
npm install
npm run check-apis
```

You should see:
```
✅ Finance token obtained: 5e311c4b2e...
✅ Successfully fetched X customers
```

## 🔍 Verify Siagh API

### Test Login Manually

```bash
curl -X POST "http://YOUR_IP/GeneralApi/LoginUser" \
  -H "Content-Type: application/json" \
  -d '{"UserName":"مدیر سیستم","Password":"YOUR_MD5_HASH"}'
```

Expected response:
```json
{
  "SessionId": "5e311c4b2eab409ca7c3ceaf5954d0a5",
  "Token": "5e311c4b2eab409ca7c3ceaf5954d0a5:0",
  "FiscalYear": 1404,
  ...
}
```

### Test Get Contacts

```bash
curl -X POST "http://YOUR_IP/api/Sgh/GEN/Gn_Web_Users/GetAll" \
  -H "Authorization: YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 📋 Common Issues

### Issue: "Invalid username or password"

**Solution:**
1. Verify your password is MD5 hashed
2. Try hashing again with `npm run hash-password`
3. Check username matches exactly (including Persian characters)

### Issue: "Connection refused"

**Solution:**
1. Check Siagh server is running
2. Verify IP address in .env
3. Check firewall/network access
4. Ensure no `/api` suffix in base URL

### Issue: "SessionId expired"

**Solution:**
- This is normal - the system will automatically re-authenticate
- Just retry the operation

## 📊 Field Mapping Reference

### Customer/Contact Fields

| Your CRM | Siagh Field | Required |
|----------|-------------|----------|
| Customer Name | fullname | ✅ Yes |
| Mobile | mobileno | No |
| Phone | telno | No |
| Email | email | No |
| Address | address | No |

### PreInvoice Configuration

Default values used by sync engine:

| Field | Default | Description |
|-------|---------|-------------|
| codenoeesanad | 2 | نوع سند: پیش فاکتور فروش |
| codesalemodel | 1 | مدل فروش: بنیان گاز |
| codenoeepardakht | 2 | نوع پرداخت: چک |
| codenoeeforush | 1 | نوع فروش: غیر رسمی |

**Note:** These can be customized per invoice in the sync logic.

## 🧪 Testing the Integration

### 1. Test Authentication
```bash
npm run check-apis
```

### 2. View Current Contacts
```bash
npm run prisma:studio
# Or directly query Siagh from terminal
```

### 3. Manual Sync Test
```bash
npm run test-sync
# Follow instructions to uncomment and add customer IDs
```

## 🔐 Security Notes

1. **Never commit .env** - Already in .gitignore
2. **Rotate passwords** - Change MD5 hash in .env after rotation
3. **Network Security** - Use VPN if accessing Siagh remotely
4. **HTTPS** - Configure Siagh with SSL in production

## 📞 Support

- **Siagh Official:** https://siaq.com/
- **API Version:** 8.3.1404.20812
- **Documentation:** See SIAGH_INTEGRATION.md for full details

## ✅ Checklist

- [ ] Siagh server accessible
- [ ] Password hashed with MD5
- [ ] .env configured
- [ ] `npm run check-apis` successful
- [ ] Can retrieve contacts
- [ ] Ready to sync!

---

**Next:** Return to main SETUP.md for full application setup.

