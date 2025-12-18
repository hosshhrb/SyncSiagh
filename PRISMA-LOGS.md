# How to View Prisma Logs

Complete guide to viewing database logs, queries, and activity in your SiaghSync application.

---

## 🚀 **Quick Commands**

```powershell
# Check database connection and stats
npm run check-db

# View database in GUI
npx prisma studio

# View application logs (includes Prisma logs)
pm2 logs siaghsync

# View recent webhook data
npm run view-webhooks
```

---

## 📊 **Method 1: Check Database Status**

Run the database check script:

```powershell
cd C:\Users\adminapp\SyncSiagh\deployment
npm run check-db
```

**What you'll see:**
```
🔍 Checking database connection...

1️⃣ Testing connection...
   ✅ Connected to database

2️⃣ Database Information:
   Database: siaghsync
   User: postgres
   Version: PostgreSQL 14.5

3️⃣ Table Statistics:
   📊 EntityMapping: 1,234 records
   📊 SyncLog: 5,678 records
   📊 WebhookSubscription: 3 records

4️⃣ Recent Sync Activity (Last 10):
   ✅ WEBHOOK - CRM_TO_FINANCE - SUCCESS
      Time: 12/16/2024, 5:30:45 PM
      Duration: 1234ms

5️⃣ Failed Syncs (Last 24h):
   ❌ Failed syncs: 2
   ⏳ Pending syncs: 0

6️⃣ Webhook Statistics (All Time):
   ✅ SUCCESS: 150 webhooks
   ❌ FAILED: 5 webhooks

✅ Database check completed successfully!
```

---

## 🎨 **Method 2: Prisma Studio (Visual GUI)**

Launch the database browser:

```powershell
npx prisma studio
```

Then open your browser to: **http://localhost:5555**

### What You Can Do:
- ✅ Browse all tables visually
- ✅ Search and filter records
- ✅ View relationships
- ✅ Edit data manually (be careful!)
- ✅ Export data

### Useful Views:

**SyncLog Table** - See all sync operations:
- Filter by `triggerType = "WEBHOOK"` to see webhook events
- Filter by `status = "FAILED"` to see errors
- Sort by `startedAt` descending to see recent activity

**EntityMapping Table** - See ID mappings:
- Shows CRM ID ↔ Finance ID mappings
- View last sync times
- Check for conflicts

---

## 📝 **Method 3: Application Logs with PM2**

### View All Logs:
```powershell
pm2 logs siaghsync
```

### View Last 100 Lines:
```powershell
pm2 logs siaghsync --lines 100
```

### Filter for Database Activity:
```powershell
# PowerShell
pm2 logs siaghsync | Select-String "prisma"
pm2 logs siaghsync | Select-String "database"
pm2 logs siaghsync | Select-String "query"

# Or save to file
pm2 logs siaghsync --lines 1000 > logs.txt
```

### What Database Logs Look Like:
```
[Nest] 1234  - 12/16/2024, 5:30:45 PM     LOG [PrismaService] Prisma Client initialized
[Nest] 1234  - 12/16/2024, 5:30:46 PM     LOG [PrismaService] Database connection successful
[Nest] 1234  - 12/16/2024, 5:30:50 PM   DEBUG [PrismaClient] Query: SELECT * FROM "EntityMapping" WHERE "crmId" = $1
[Nest] 1234  - 12/16/2024, 5:30:50 PM   DEBUG [PrismaClient] Params: ["12345"]
[Nest] 1234  - 12/16/2024, 5:30:50 PM   DEBUG [PrismaClient] Duration: 5ms
```

---

## 🔧 **Method 4: Enable Detailed Query Logging**

### Temporary Logging (No Code Changes)

Set environment variable before starting:

```powershell
# In .env file, add:
DEBUG=prisma:*
DATABASE_LOG_QUERIES=true

# Then restart
pm2 restart siaghsync
```

### View Query Logs:
```powershell
pm2 logs siaghsync | Select-String "Query:"
```

---

## 💾 **Method 5: Direct Database Queries**

### Connect to Database:

```powershell
# Using psql (if installed)
psql postgresql://username:password@localhost:5432/siaghsync

# Or use Prisma Studio (easier)
npx prisma studio
```

### Useful SQL Queries:

**Recent Webhook Activity:**
```sql
SELECT
  id,
  status,
  "triggerType",
  "sourceEntityId",
  "startedAt",
  "durationMs",
  "errorMessage"
FROM "SyncLog"
WHERE "triggerType" = 'WEBHOOK'
ORDER BY "startedAt" DESC
LIMIT 20;
```

**Failed Syncs:**
```sql
SELECT
  status,
  "errorMessage",
  COUNT(*) as count
FROM "SyncLog"
WHERE status = 'FAILED'
  AND "startedAt" > NOW() - INTERVAL '24 hours'
GROUP BY status, "errorMessage"
ORDER BY count DESC;
```

**Sync Performance:**
```sql
SELECT
  "triggerType",
  status,
  COUNT(*) as total,
  AVG("durationMs") as avg_duration_ms,
  MAX("durationMs") as max_duration_ms
FROM "SyncLog"
WHERE "startedAt" > NOW() - INTERVAL '7 days'
GROUP BY "triggerType", status
ORDER BY total DESC;
```

**Entity Mappings:**
```sql
SELECT
  "entityType",
  COUNT(*) as total_mappings,
  COUNT("crmId") as has_crm_id,
  COUNT("financeId") as has_finance_id
FROM "EntityMapping"
GROUP BY "entityType";
```

---

## 🔍 **Method 6: Check Specific Issues**

### Check Database Connection:

```powershell
npm run check-db
```

If it fails, check:
1. PostgreSQL is running
2. DATABASE_URL in `.env` is correct
3. Network connectivity
4. Firewall settings

### Check for Slow Queries:

```sql
-- Syncs taking longer than 5 seconds
SELECT
  id,
  "sourceEntityId",
  "durationMs",
  "startedAt",
  status
FROM "SyncLog"
WHERE "durationMs" > 5000
ORDER BY "durationMs" DESC
LIMIT 10;
```

### Check for Stuck Pending Operations:

```sql
-- Operations pending for more than 5 minutes
SELECT
  id,
  "triggerType",
  "sourceEntityId",
  "startedAt",
  NOW() - "startedAt" as pending_duration
FROM "SyncLog"
WHERE status = 'PENDING'
  AND "startedAt" < NOW() - INTERVAL '5 minutes'
ORDER BY "startedAt" ASC;
```

---

## 📈 **Method 7: Real-Time Monitoring**

### Keep Logs Open:
```powershell
# Watch logs continuously
pm2 logs siaghsync --lines 50

# Or with filter
pm2 logs siaghsync | Select-String -Pattern "database|query|webhook"
```

### Monitor Database Activity:

```powershell
# In one terminal - Run the app with logs
pm2 logs siaghsync

# In another terminal - Watch database stats
while ($true) {
  Clear-Host
  npm run check-db
  Start-Sleep -Seconds 10
}
```

---

## ⚙️ **Configuration: Enable Query Logging**

If you want to see ALL SQL queries (for debugging):

### Option 1: Environment Variable

Add to `.env`:
```env
DATABASE_LOG_QUERIES=true
DEBUG=prisma:query
```

### Option 2: Modify Prisma Client (Development Only)

In your main application file, find where PrismaClient is initialized and update:

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

// Log all queries
prisma.$on('query', (e: any) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});
```

**⚠️ Warning:** This creates A LOT of logs. Only use for debugging!

---

## 🆘 **Troubleshooting Common Issues**

### "Can't reach database server"

**Check:**
```powershell
npm run check-db
```

**Solutions:**
1. Verify PostgreSQL is running: `sc query postgresql` or check Services
2. Check DATABASE_URL in `.env`
3. Test connection: `psql -h localhost -U postgres -d siaghsync`

### "Migrations not up to date"

**Fix:**
```powershell
npx prisma migrate deploy
npx prisma generate
```

### "Connection pool exhausted"

**Check active connections:**
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'siaghsync';
```

**Solution:** Restart the application:
```powershell
pm2 restart siaghsync
```

### Slow Queries

**Check slow operations:**
```powershell
npm run view-webhooks --count 100
```

Look for operations with high duration (> 5000ms).

---

## 📋 **Quick Reference**

| Task | Command |
|------|---------|
| Check database status | `npm run check-db` |
| Visual database browser | `npx prisma studio` |
| View application logs | `pm2 logs siaghsync` |
| View webhook logs | `npm run view-webhooks` |
| View failed syncs | `npm run view-failed` |
| Run migrations | `npx prisma migrate deploy` |
| Regenerate client | `npx prisma generate` |
| Test connection | `npm run check-apis` |

---

## 🎯 **Best Practices**

1. **Regular Monitoring:**
   ```powershell
   npm run check-db
   npm run view-webhooks
   ```

2. **Check for Failures:**
   ```powershell
   npm run view-failed
   ```

3. **Use Prisma Studio** for visual inspection:
   ```powershell
   npx prisma studio
   ```

4. **Keep Logs Accessible:**
   ```powershell
   pm2 logs siaghsync --lines 1000 > today-logs.txt
   ```

5. **Monitor Performance:** Check average duration in webhook logs

---

Need more help? Check `WEBHOOK-LOGS.md` for webhook-specific logging.


SIAGH


 this is the request and response we get for  creating user in the siagh 
 request {
    "formId": "2BFDA",
    "ctrlValues": "NickName=dbgrid1.#nickname#|gn_web_users.isactive=1|gn_web_users.gender=|gn_web_users.websiteaddress=|gn_web_users.pocode=|gn_web_users.codeostan=|gn_web_users.address=|gn_web_users.codeshahr=|gn_web_users.countrycode=|gn_web_users.email=|gn_web_users.fullname=مخاطب تست|gn_web_users.mobileno=09123456689|gn_web_users.telno=02551|gn_web_users.tozihat=|gn_web_users.password=123456|gn_web_users.nickname=",
    "parameters": "CodeMain=",
    "dataRows": "[]",
    "attachments": "[]",
    "postCode": "1110",
    "flowId": ""
}
response of success make sure our implmentaion for siagh is correct also add the tarafType 
 {
    "Errors": [],
    "FinalMessages": [],
    "ReturnValue": true,
    "ReturnCode": "8346",
    "ReturnParams": "8346"
}



CRM 
for creating identity in crm 
we need the provide this info in the api calls
if the identity we are inserting in crm was person identified using twoard type and we where calling the person api for creating the person identity we should set   "crmObjectTypeCode": "person",
always 
and if was organization   "crmObjectTypeCode": "organization",

also the categorie in both are always this  "categories": [
    {
      "key": "syaghcontact"
    }

    also in the initial import for creating identity in crm we must use the create person or organization api identity api is only for getting all the idenity list "pageNumber":0,
  "pageSize": 150,
  "searchTerm": ""

  it starts from page zero and we should get next pages until there we get an empty list so we know we are in last page or increase page size to get all of records 


  update the test all apis and the import logic to start from page 0


  whats this in test we dont want this  1.2: Get CRM Customers (First 5)

  we get the identities from crm 

  why this is not working Create New Test Customer in CRM
[2025-12-18T11:48:22.243Z] ------------------------------------------------------------
[2025-12-18T11:48:22.244Z] REQUEST: POST http://172.16.16.16/api/v2/Identities
[2025-12-18T11:48:22.245Z] REQUEST HEADERS: {
  "Authorization": "Bearer eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNyc2Etc2hhMjU2Iiwia2lkIjoiNDk0QUVGREJEODcxMUU4NDA3NTU0RTA3RkU0MTIwQTI2QTgyMEJFNiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjQyMzNjYmVlLTlhYjMtNGE0My1iZTk5LWI1ZTc2YzZkMDk4ZSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ3ZWJzZXJ2aWNlIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS9hY2Nlc3Njb250cm9sc2VydmljZS8yMDEwLzA3L2NsYWltcy9pZGVudGl0eXByb3ZpZGVyIjoiUEcgQVNQLk5FVCBJZGVudGl0eSIsIkFzcE5ldC5JZGVudGl0eS5TZWN1cml0eVN0YW1wIjoiNDIzM2NiZWUtOWFiMy00YTQzLWJlOTktYjVlNzZjNmQwOThlIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjpbIlN5c3RlbU9wZXJhdG9yIiwiU3lzdGVtQ3VzdG9tZXIiLCJTeXN0ZW1BZG1pbiJdLCJlbWFpbCI6IndlYkBnbWFpbC5jb20iLCJpZGVudGl0eVR5cGUiOiJQZXJzb24iLCJ1YXNpIjoiZWJkOTcwOTEtNzI4NC00ODY4LWI4NWUtOWZlZTQ4NDdjYjA3IiwibmJmIjoxNzY2MDU4Mjk4LCJleHAiOjE3NjYwNjU0OTgsImlzcyI6IlBheWFtR29zdGFyLmNvbSIsImF1ZCI6ImFwcC5hcGkuZW1wbG95ZWVwcm9maWxlIn0.qakoOIsp1QUk5gkN3iARuESUd72D1-gXIuYyRRBqQ2Nrv5co4SOlJFL8F2Cg53jsqkWQbHKo5Vd0JsAhOGC6Big6I6P8w87gq49zay86XjQE057EzEd2Vy4zGNCowAqPr63VmEhnCzAK41_hlVvdAjkz1zRH2-d2RrEE7z1NZHbRyUe528V8IunI8nzL5dLEe5r2LaF1pPdjj6EUi9R4QxEqGTZI8s05M6VruX3Xr1Kzb0966S1pdAcg6nb_g-_EMut6HqFZoKJ1BvMq6uKldsr8IizlCfcNvpJSJm3Y3LS-jClQ55TUXa7U3oB2eH9FPXBatKmgnCKLsptqRd6shQ",
  "Content-Type": "application/json"
}
[2025-12-18T11:48:22.247Z] REQUEST DATA: {
  "firstName": "Test",
  "lastName": "Customer API Test",
  "nickName": "Test Customer 1766058502244",
  "identityType": "Person",
  "mobile": "09152697812",
  "email": "test1766058502244931@example.com",
  "nationalCode": "8961142665"
}
[2025-12-18T11:48:22.320Z] RESPONSE STATUS: 201 Created
[2025-12-18T11:48:22.321Z] FULL RESPONSE OBJECT: ""
[2025-12-18T11:48:22.324Z] ⚠ WARNING: Customer created but ID not found in response. Response: ""
[2025-12-18T11:48:22.325Z] 




this is a sample person creation request person and orginazation create logic mostly same only some filed diffrences but required fileds are mostly same  post http://172.16.16.16/api/v2/crmobject/person/create

request {
  "crmObjectTypeCode": "person",
  "refId": "ref-id-123",
  "colorId": 1,
  "description": "This is a test description.",
  "subject": "Test Subject",
  "assignedToUserName": "john_doe",
  "nickName": "Johnny",
  "email": "email@example.com",
  "alternativeEmail": "alt-email@example.com",
  "website": "http://example.com",
  "customerNumber": "100-09123467859",
  "customerDate": "2025-12-18T08:38:59.282Z",
  "categories": [
    {
      "key": "syaghcontact"
    }
  ],
  "dontSms": true,
  "dontSocialSms": false,
  "dontPhoneCall": false,
  "dontEmail": true,
  "dontFax": false,
  "supportUsername": "support_user",
  "saleUsername": "sales_user",
  "otherUsername": "other_user",
  "facebookUsername": "facebook_user",
  "preferredContactType": "email",
  "nationalCode": "123-45-6789",
  "economicCode": "987654321",
  "sourceTypeIndex": 2,
  "firstName": "John",
  "lastName": "Doe",
  "birthDate": "1990-05-01T08:38:59.282Z",
  "gender": "male",
  "personPrefix": "Mr.",
  "degree": "Bachelors",
  "paymentStatusType": "paid",
  "areasOfInterest": "sports, music, technology",
  "mannerType": "friendly",
  "spouse": "Jane Doe",
  "hobbies": "hiking, reading",
  "children": "2"

}

response 200 
{
    "crmId": "3f6448af-6dfd-4c36-8be1-9f3d46ccff6c"
}

this is full sample from swagger POST
/api/v2/crmobject/person/create
Parameters
Name	Description
model
object
(body)
	

{
  "crmObjectTypeCode": "string",
  "parentCrmObjectId": "string",
  "extendedProperties": [
    {
      "value": "string",
      "userKey": "string",
      "preview": {
        "name": "string",
        "object": "string"
      }
    }
  ],
  "tags": [
    "string"
  ],
  "refId": "string",
  "stageId": "string",
  "colorId": 0,
  "identityId": "string",
  "description": "string",
  "subject": "string",
  "assignedToUserName": "string",
  "nickName": "string",
  "phoneContacts": [
    {
      "id": "string",
      "default": true,
      "phoneType": "string",
      "phoneNumber": "string",
      "continuedNumber": "string",
      "extension": "string"
    }
  ],
  "addressContacts": [
    {
      "id": "string",
      "default": true,
      "country": "string",
      "state": "string",
      "city": "string",
      "addressType": "string",
      "areaCode": "string",
      "address": "string",
      "zipCode": "string",
      "zipBox": "string",
      "longitude": 0,
      "latitude": 0
    }
  ],
  "email": "string",
  "alternativeEmail": "string",
  "website": "string",
  "customerNumber": "string",
  "customerDate": "2025-12-18T10:19:33.168Z",
  "categories": [
    {
      "id": "string",
      "key": "string"
    }
  ],
  "dontSms": true,
  "dontSocialSms": true,
  "dontPhoneCall": true,
  "dontEmail": true,
  "dontFax": true,
  "supportUsername": "string",
  "saleUsername": "string",
  "otherUsername": "string",
  "facebookUsername": "string",
  "preferredContactType": "string",
  "nationalCode": "string",
  "economicCode": "string",
  "sourceTypeIndex": 0,
  "firstName": "string",
  "lastName": "string",
  "birthDate": "2025-12-18T10:19:33.168Z",
  "gender": "string",
  "personPrefix": "string",
  "degree": "string",
  "paymentStatusType": "string",
  "areasOfInterest": "string",
  "mannerType": "string",
  "spouse": "string",
  "hobbies": "string",
  "children": "string",
  "organizations": [
    {
      "id": "string",
      "organizationId": "string",
      "personId": "string",
      "profession": "string",
      "jobType": "string",
      "office": "string",
      "department": "string"
    }
  ]
}


POST
/api/v2/crmobject/organization/create
Parameters
Name	Description
model
object
(body)
	

{
  "crmObjectTypeCode": "string",
  "parentCrmObjectId": "string",
  "extendedProperties": [
    {
      "value": "string",
      "userKey": "string",
      "preview": {
        "name": "string",
        "object": "string"
      }
    }
  ],
  "tags": [
    "string"
  ],
  "refId": "string",
  "stageId": "string",
  "colorId": 0,
  "identityId": "string",
  "description": "string",
  "subject": "string",
  "assignedToUserName": "string",
  "nickName": "string",
  "phoneContacts": [
    {
      "id": "string",
      "default": true,
      "phoneType": "string",
      "phoneNumber": "string",
      "continuedNumber": "string",
      "extension": "string"
    }
  ],
  "addressContacts": [
    {
      "id": "string",
      "default": true,
      "country": "string",
      "state": "string",
      "city": "string",
      "addressType": "string",
      "areaCode": "string",
      "address": "string",
      "zipCode": "string",
      "zipBox": "string",
      "longitude": 0,
      "latitude": 0
    }
  ],
  "email": "string",
  "alternativeEmail": "string",
  "website": "string",
  "customerNumber": "string",
  "customerDate": "2025-12-18T11:50:47.749Z",
  "categories": [
    {
      "id": "string",
      "key": "string"
    }
  ],
  "dontSms": true,
  "dontSocialSms": true,
  "dontPhoneCall": true,
  "dontEmail": true,
  "dontFax": true,
  "supportUsername": "string",
  "saleUsername": "string",
  "otherUsername": "string",
  "facebookUsername": "string",
  "preferredContactType": "string",
  "nationalCode": "string",
  "economicCode": "string",
  "sourceTypeIndex": 0,
  "businessType": "string",
  "registerNumber": "string",
  "registerDate": "2025-12-18T11:50:47.749Z",
  "shareType": "string",
  "trademark": "string",
  "ownershipType": "string",
  "tradeType": "string",
  "managerId": "string",
  "employees": [
    {
      "id": "string",
      "organizationId": "string",
      "personId": "string",
      "profession": "string",
      "jobType": "string",
      "office": "string",
      "department": "string"
    }
  ]
}


