# SiaghSync - Two-Way Sync Engine

A production-ready middleware for bidirectional synchronization between CRM (Payamgostar) and **Siagh Finance System** (سیاق).

## Features

- **Two-way synchronization** between CRM and Finance systems
- **Dual sync modes**: Polling and webhook-based event processing
- **Conflict resolution**: Last-write-wins strategy (CRM priority)
- **Loop prevention**: Intelligent detection to prevent infinite sync loops
- **Idempotency**: All operations are idempotent and safe to retry
- **Comprehensive traceability**: Full audit log of all sync operations
- **Background job processing**: Async processing with BullMQ and Redis
- **Type-safe**: Full TypeScript coverage

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for development)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Hash Siagh password (REQUIRED!)
npm run hash-password your-siagh-password
# Copy the MD5 hash to FINANCE_PASSWORD in .env

# 5. Initialize database
npm run prisma:generate
npm run prisma:migrate

# 6. Run initial import (one-time)
npm run initial-import

# 7. Start application
npm run start:dev
```

## Deployment (Linux → Windows)

**On Linux:**
```bash
./scripts/build-for-production.sh
# Transfer deployment/ folder to Windows server
```

**On Windows (as Administrator):**
```powershell
.\deploy-windows.ps1
# Edit .env with credentials
npm run initial-import
pm2 start dist/main.js --name siaghsync
```

## Documentation

**📚 [GUIDE.md](GUIDE.md) - Complete Guide**
- Full setup and configuration
- Deployment instructions
- Usage and commands
- Monitoring and logging
- Troubleshooting
- API reference

**Additional Docs:**
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [PRISMA-LOGS.md](PRISMA-LOGS.md) - How to view database logs
- [WEBHOOK-LOGS.md](WEBHOOK-LOGS.md) - How to view webhook logs

## Key Commands

```bash
# Development
npm run start:dev          # Start with hot reload

# Database
npm run prisma:studio      # Open database GUI

# Sync Operations
npm run initial-import     # One-time import from Finance to CRM
npm run check-apis         # Test API connectivity
npm run check-db           # Check database status

# Monitoring
npm run view-webhooks      # View recent webhook logs
pm2 logs siaghsync         # View application logs

# Utilities
npm run hash-password      # Generate MD5 hash for Siagh password
```

## API Endpoints

- `POST /webhook/crm/identity` - CRM identity changes
- `POST /webhook/crm/invoice` - CRM invoice changes
- `GET /health` - Health check

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Job Queue**: BullMQ with Redis
- **HTTP Client**: Axios

## Architecture

```
CRM (Payamgostar) ←→ SiaghSync ←→ Finance (Siagh)
                      ├── Webhook Handlers
                      ├── Job Processors
                      ├── Sync Orchestrator
                      └── Entity Mappings
```

**Sync Strategy:**
1. Initial Import: Finance → CRM (one-time)
2. Ongoing Sync: CRM → Finance (continuous)
3. Conflict Resolution: CRM always wins

## Support

For detailed information on setup, deployment, monitoring, and troubleshooting, see [GUIDE.md](GUIDE.md).

## License

MIT

