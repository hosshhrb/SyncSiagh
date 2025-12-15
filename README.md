# SiaghSync - Two-Way Sync Engine

A production-ready middleware for bidirectional synchronization between CRM (Payamgostar) and **Siagh Finance System** (سیاق).

## Features

- **Two-way synchronization** between CRM and Finance systems
- **Dual sync modes**: Polling and webhook-based event processing
- **Conflict resolution**: Last-write-wins strategy
- **Loop prevention**: Intelligent detection to prevent infinite sync loops
- **Idempotency**: All operations are idempotent and safe to retry
- **Comprehensive traceability**: Full audit log of all sync operations
- **Background job processing**: Async processing with BullMQ and Redis
- **Type-safe**: Full TypeScript coverage

## Architecture

The sync engine acts as a middleware layer between CRM and Finance systems, ensuring they never communicate directly. All synchronization logic flows through the centralized Sync Orchestrator.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Job Queue**: BullMQ with Redis
- **HTTP Client**: Axios

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- pgAdmin (port 5050)

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

**Important for Siagh Finance:**
- Password must be MD5 hashed! Run: `npm run hash-password your-password`
- See [SIAGH_SETUP.md](SIAGH_SETUP.md) for detailed Siagh integration guide

### 5. Initialize Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Run Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Database Management

- **Prisma Studio**: `npm run prisma:studio`
- **pgAdmin**: http://localhost:5050 (admin@siagh.local / admin)

## API Endpoints

- `POST /webhook/crm` - Receive CRM webhook events
- `GET /health` - Health check endpoint

## Project Structure

```
src/
├── config/           # Configuration management
├── crm/             # CRM API client and authentication
├── finance/         # Finance API client and authentication
├── sync/            # Core sync logic
│   ├── orchestrator/  # Sync orchestration and entity-specific logic
│   ├── jobs/          # Background job processors
│   ├── webhook/       # Webhook handlers
│   └── strategy/      # Conflict resolution and loop detection
├── database/        # Prisma service and repositories
└── common/          # Shared utilities and types
```

## Development

### Running Tests

```bash
npm run test
npm run test:watch
npm run test:cov
```

### Code Quality

```bash
npm run lint
npm run format
```

## Monitoring

- Check sync logs in database: `SyncLog` table
- Monitor failed syncs: `SyncRetryQueue` table
- View entity mappings: `EntityMapping` table

## Siagh Finance Integration

This project integrates with **Siagh** (سیاق) Finance System. Key points:

- Siagh API v8.3.1404.20812
- Requires MD5 hashed passwords
- Uses SessionId authentication
- Complex SaveFormData structure
- Full Persian/Farsi support

**Quick Setup:**
1. Hash password: `npm run hash-password`
2. Configure .env with Siagh IP and credentials
3. See [SIAGH_SETUP.md](SIAGH_SETUP.md) for details
4. See [SIAGH_INTEGRATION.md](SIAGH_INTEGRATION.md) for API reference

## Documentation

- [QUICKSTART.md](QUICKSTART.md) - Get running in 5 minutes
- [SETUP.md](SETUP.md) - Detailed setup guide
- [SIAGH_SETUP.md](SIAGH_SETUP.md) - Siagh-specific configuration
- [SIAGH_INTEGRATION.md](SIAGH_INTEGRATION.md) - Complete Siagh API reference
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Technical architecture

## Deployment

### Quick Deployment (Linux → Windows)

**On Linux (Development):**
```bash
./scripts/build-for-production.sh
# Transfer deployment/ folder to Windows server
```

**On Windows (Production):**
```powershell
# Run as Administrator
.\deploy-windows.ps1
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

## License

MIT

