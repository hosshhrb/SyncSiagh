# What Redis Does in This Project

## Overview

**Redis** is used as a **job queue backend** for **BullMQ** - a job queue system for Node.js.

---

## 🎯 Main Purpose

Redis stores **sync jobs** that need to be processed asynchronously when webhooks are received from CRM.

---

## 🔄 How It Works

### Without Redis (Synchronous - BAD):
```
CRM sends webhook
    ↓
Webhook endpoint receives it
    ↓
Process sync immediately (takes 5-10 seconds)
    ↓
Return response to CRM
    ↓
❌ CRM waits 5-10 seconds for response (timeout risk!)
```

### With Redis (Asynchronous - GOOD):
```
CRM sends webhook
    ↓
Webhook endpoint receives it
    ↓
Add job to Redis queue (takes 0.1 seconds)
    ↓
Return 200 OK immediately to CRM ✅
    ↓
Background worker processes job from Redis
    ↓
Sync happens asynchronously
```

---

## 📋 What Redis Stores

### 1. **Job Queue**
Redis stores jobs waiting to be processed:

```
Queue: "sync"
├─ Job 1: { type: "crm-identity-webhook", identityId: "abc-123", ... }
├─ Job 2: { type: "crm-invoice-webhook", invoiceId: "inv-456", ... }
└─ Job 3: { type: "crm-identity-webhook", identityId: "def-789", ... }
```

### 2. **Job Status**
- **Waiting** - Jobs waiting to be processed
- **Active** - Jobs currently being processed
- **Completed** - Successfully finished jobs
- **Failed** - Jobs that failed (for retry)

### 3. **Job Data**
Each job contains:
- Job type (identity-webhook, invoice-webhook, etc.)
- Entity ID
- Full payload from webhook
- Timestamp
- Retry count

---

## 🔧 Technical Details

### Used By: BullMQ

**BullMQ** is a job queue library that uses Redis as its storage backend.

```typescript
// Configuration in app.module.ts
BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})
```

### Queue Name: `"sync"`

All sync jobs go into a queue named `"sync"`.

---

## 📊 Real Example

### When CRM Sends Identity Webhook:

**1. Webhook Controller receives it:**
```typescript
@Post('identity')
async handleIdentityWebhook(@Body() payload: any) {
  // Add job to Redis queue
  await this.syncQueue.add('crm-identity-webhook', {
    identityId: payload.identityId,
    action: payload.action,
    rawPayload: payload,
  });
  
  // Return immediately (doesn't wait for sync)
  return { success: true };
}
```

**2. Job stored in Redis:**
```
Redis Key: bull:sync:12345
Value: {
  name: "crm-identity-webhook",
  data: {
    identityId: "abc-123",
    action: "created",
    rawPayload: {...}
  },
  opts: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 }
  }
}
```

**3. Background Worker processes it:**
```typescript
@Processor('sync')
class SyncJobProcessor {
  async process(job: Job) {
    // This runs in background
    await this.identitySyncService.syncIdentity(
      job.data.identityId,
      job.data.identityType
    );
  }
}
```

---

## ✅ Benefits of Using Redis

### 1. **Fast Response to CRM**
- Webhook returns immediately (200 OK)
- CRM doesn't wait for sync to complete
- No timeout issues

### 2. **Reliability**
- Jobs persist in Redis
- If application crashes, jobs are not lost
- Can retry failed jobs

### 3. **Scalability**
- Can process multiple jobs in parallel
- Can add more workers to process faster
- Jobs are distributed across workers

### 4. **Retry Logic**
- Failed jobs automatically retry
- Exponential backoff (wait longer between retries)
- Max 3 attempts by default

### 5. **Monitoring**
- Can see queue stats:
  - How many jobs waiting
  - How many active
  - How many completed
  - How many failed

---

## 🔍 What Happens If Redis Is Down?

**If Redis is not running:**
- ❌ Webhook endpoints will fail
- ❌ Jobs cannot be queued
- ❌ Application may crash on startup

**Solution:**
- Redis must be running for the application to work
- Use Docker: `docker-compose up -d redis`
- Or use cloud Redis (AWS ElastiCache, Redis Cloud, etc.)

---

## 📊 Queue Statistics

You can check queue stats in logs:

```
📊 Sync Queue Stats:
   Waiting: 5
   Active: 2
   Completed: 150
   Failed: 1
```

---

## 🎯 Summary

**Redis in this project:**
- ✅ Stores job queue for async processing
- ✅ Used by BullMQ library
- ✅ Enables fast webhook responses
- ✅ Provides reliability and retry logic
- ✅ Allows parallel job processing
- ✅ Required for webhook processing to work

**Without Redis:**
- ❌ Webhooks would be slow
- ❌ CRM would timeout waiting for response
- ❌ No retry logic
- ❌ Jobs lost if application crashes

---

## 🚀 Configuration

**Environment Variables:**
```bash
REDIS_HOST=localhost    # Redis server address
REDIS_PORT=6379         # Redis port
```

**Docker:**
```bash
docker-compose up -d redis
```

**Cloud Redis:**
```bash
REDIS_HOST=your-redis-cloud-host
REDIS_PORT=6379
```

---

**Redis is essential for async webhook processing!** 🔴

