#!/bin/bash
# Test script with detailed logging
# Usage: ./scripts/test-with-logs.sh

set -e

echo "🧪 SiaghSync Test Script with Logs"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}   Copy .env.example to .env and configure it${NC}"
    exit 1
fi

echo -e "${CYAN}📋 Step 1: Checking Infrastructure...${NC}"
echo ""

# Check Docker services
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker services are running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting Docker services...${NC}"
    docker-compose up -d
    sleep 5
fi

echo ""
echo -e "${CYAN}📋 Step 2: Testing API Connectivity...${NC}"
echo ""

# Test APIs
npm run check-apis

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ API connectivity test failed!${NC}"
    echo -e "${YELLOW}   Please check your credentials in .env${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}📋 Step 3: Starting Application with Logs...${NC}"
echo ""
echo -e "${YELLOW}   Application will start in development mode${NC}"
echo -e "${YELLOW}   Press Ctrl+C to stop${NC}"
echo ""
echo "==================================="
echo ""

# Start application with logs
npm run start:dev

