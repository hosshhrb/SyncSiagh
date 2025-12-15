#!/bin/bash
# Quick deployment script for Linux server
# Usage: ./scripts/deploy-to-server.sh [server-user@server-ip]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 SiaghSync Server Deployment${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Check if server target provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}📦 Local Deployment Mode${NC}"
    echo -e "${YELLOW}   Deploying to current machine...${NC}"
    SERVER_TARGET=""
    DEPLOY_PATH="./server-deployment"
else
    echo -e "${YELLOW}📦 Remote Deployment Mode${NC}"
    echo -e "${YELLOW}   Target: $1${NC}"
    SERVER_TARGET="$1"
    DEPLOY_PATH="/opt/siaghsync"
fi

# Step 1: Build
echo ""
echo -e "${CYAN}Step 1: Building deployment package...${NC}"
if [ ! -f "scripts/build-for-production.sh" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

./scripts/build-for-production.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 2: Transfer (if remote)
if [ -n "$SERVER_TARGET" ]; then
    echo ""
    echo -e "${CYAN}Step 2: Transferring to server...${NC}"
    echo -e "${YELLOW}   This may take a few minutes...${NC}"
    
    # Create directory on server
    ssh "$SERVER_TARGET" "mkdir -p $DEPLOY_PATH" || {
        echo -e "${RED}❌ Failed to connect to server${NC}"
        exit 1
    }
    
    # Transfer files
    rsync -avz --progress deployment/ "$SERVER_TARGET:$DEPLOY_PATH/" || {
        echo -e "${RED}❌ Transfer failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Files transferred${NC}"
    
    # Step 3: Setup on server
    echo ""
    echo -e "${CYAN}Step 3: Setting up on server...${NC}"
    
    ssh "$SERVER_TARGET" << EOF
        cd $DEPLOY_PATH
        echo "Installing dependencies..."
        npm ci --production
        echo "Generating Prisma client..."
        npx prisma generate
        echo ""
        echo -e "\033[0;32m✅ Setup complete on server!\033[0m"
        echo ""
        echo "Next steps:"
        echo "  1. SSH to server: ssh $SERVER_TARGET"
        echo "  2. cd $DEPLOY_PATH"
        echo "  3. cp .env.example .env"
        echo "  4. nano .env  # Edit with your credentials"
        echo "  5. npx prisma migrate deploy"
        echo "  6. node dist/main.js"
EOF

else
    # Local deployment
    echo ""
    echo -e "${CYAN}Step 2: Setting up locally...${NC}"
    
    rm -rf "$DEPLOY_PATH"
    cp -r deployment "$DEPLOY_PATH"
    cd "$DEPLOY_PATH"
    
    echo "Installing dependencies..."
    npm ci --production
    
    echo "Generating Prisma client..."
    npx prisma generate
    
    echo ""
    echo -e "${GREEN}✅ Local deployment ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. cd $DEPLOY_PATH"
    echo "  2. cp .env.example .env"
    echo "  3. nano .env  # Edit with your credentials"
    echo "  4. npx prisma migrate deploy"
    echo "  5. node dist/main.js"
fi

echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""

