#!/bin/bash
# Quick deployment script - Build and prepare for Windows deployment
# Usage: ./scripts/quick-deploy.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=================================${NC}"
echo -e "${CYAN}SiaghSync Quick Deploy${NC}"
echo -e "${CYAN}=================================${NC}"
echo ""

# Step 1: Build
echo -e "${YELLOW}Building deployment package...${NC}"
./scripts/build-for-production.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo ""
echo -e "${YELLOW}1. Transfer to Windows server:${NC}"
echo -e "   ${GREEN}scp -r deployment/* adminapp@your-server:C:/Users/adminapp/SyncSiagh/deployment/${NC}"
echo ""
echo -e "   ${CYAN}Or use WinSCP, FileZilla, or any file transfer tool${NC}"
echo ""
echo -e "${YELLOW}2. On Windows server, run PowerShell as Administrator:${NC}"
echo -e "   ${GREEN}cd C:\\Users\\adminapp\\SyncSiagh\\deployment${NC}"
echo -e "   ${GREEN}.\\deploy-windows.ps1${NC}"
echo ""
echo -e "   ${CYAN}With API check:${NC}"
echo -e "   ${GREEN}.\\deploy-windows.ps1 -CheckAPIs${NC}"
echo ""
echo -e "   ${CYAN}Auto mode (no prompts):${NC}"
echo -e "   ${GREEN}.\\deploy-windows.ps1 -SkipPrompts${NC}"
echo ""
echo -e "${CYAN}Deployment package location: ${YELLOW}deployment/${NC}"
echo ""
