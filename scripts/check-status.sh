#!/bin/bash
# Quick status check script

set -e

echo "🔍 SiaghSync Status Check"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check .env
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${RED}❌ .env file missing${NC}"
    echo "   Run: cp .env.example .env"
    exit 1
fi

# Check Docker containers
echo ""
echo "🐳 Docker Containers:"
if docker ps | grep -q "siagh_sync_postgres"; then
    echo -e "${GREEN}✅ PostgreSQL running${NC}"
else
    echo -e "${RED}❌ PostgreSQL not running${NC}"
fi

if docker ps | grep -q "siagh_sync_redis"; then
    echo -e "${GREEN}✅ Redis running${NC}"
else
    echo -e "${RED}❌ Redis not running${NC}"
fi

# Check configuration
echo ""
echo "⚙️  Configuration:"

source .env 2>/dev/null || true

if [ "$DATABASE_URL" != "file:./dev.db" ] && [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✅ DATABASE_URL configured${NC}"
else
    echo -e "${RED}❌ DATABASE_URL not configured${NC}"
fi

if [ "$CRM_USERNAME" != "your-username" ] && [ -n "$CRM_USERNAME" ]; then
    echo -e "${GREEN}✅ CRM credentials configured${NC}"
else
    echo -e "${YELLOW}⚠️  CRM credentials need configuration${NC}"
    echo "   Edit .env and set CRM_USERNAME and CRM_PASSWORD"
fi

if [ -n "$FINANCE_API_BASE_URL" ]; then
    echo -e "${GREEN}✅ Finance API configured${NC}"
    echo "   URL: $FINANCE_API_BASE_URL"
fi

# Check Prisma
echo ""
echo "🗄️  Database:"
if [ -d "node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma client not generated${NC}"
    echo "   Run: npm run prisma:generate"
fi

if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo -e "${GREEN}✅ Database migrations applied${NC}"
else
    echo -e "${YELLOW}⚠️  Database migrations not applied${NC}"
    echo "   Run: npm run prisma:migrate"
fi

echo ""
echo "========================="
echo ""

# Summary
if docker ps | grep -q "siagh_sync_postgres" && docker ps | grep -q "siagh_sync_redis" && [ -f ".env" ]; then
    echo -e "${GREEN}✅ Infrastructure ready!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Configure CRM credentials in .env"
    echo "   2. Run: npm run check-apis"
    echo "   3. Run: npm run start:dev (to see logs)"
else
    echo -e "${RED}❌ Setup incomplete${NC}"
    echo "   Please run the setup steps"
fi

echo ""

