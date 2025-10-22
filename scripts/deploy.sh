#!/bin/bash

# Multi-Brand Email Automation - Deployment Script
# This script deploys the entire system to production

set -e  # Exit on error

echo "========================================="
echo "Multi-Brand Email Automation Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Load environment variables
source .env

echo -e "${GREEN}✓${NC} Environment variables loaded"

# Step 1: Install dependencies
echo ""
echo "Step 1: Installing dependencies..."
cd tracking-server
npm install --production
cd ..
echo -e "${GREEN}✓${NC} Dependencies installed"

# Step 2: Build Docker images
echo ""
echo "Step 2: Building Docker images..."
docker-compose build
echo -e "${GREEN}✓${NC} Docker images built"

# Step 3: Start services
echo ""
echo "Step 3: Starting services..."
docker-compose up -d
echo -e "${GREEN}✓${NC} Services started"

# Step 4: Wait for services to be ready
echo ""
echo "Step 4: Waiting for services to be ready..."
sleep 10

# Check tracking server health
echo "Checking tracking server..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Tracking server is healthy"
else
    echo -e "${RED}✗${NC} Tracking server health check failed"
    exit 1
fi

# Check n8n (if self-hosted)
if [ "${SELF_HOST_N8N}" = "true" ]; then
    echo "Checking n8n..."
    if curl -f http://localhost:5678/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} n8n is healthy"
    else
        echo -e "${YELLOW}⚠${NC} n8n health check failed (may need manual verification)"
    fi
fi

# Step 5: Display status
echo ""
echo "========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Services running:"
echo "  - Tracking Server: http://localhost:3000"
echo "  - n8n: http://localhost:5678 (if self-hosted)"
echo ""
echo "Next steps:"
echo "  1. Import n8n workflows from n8n-workflows/ directory"
echo "  2. Configure Google Sheets using google-apps-script files"
echo "  3. Set up Airtable base with provided schema"
echo "  4. Configure Lido automations"
echo "  5. Test with a sample campaign"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose down"
echo ""
