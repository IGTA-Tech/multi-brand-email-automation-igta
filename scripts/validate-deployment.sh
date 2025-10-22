#!/bin/bash

# Multi-Brand Email Automation - Deployment Validation Script
# Validates that all components are properly configured and running

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
WARN=0

# Functions
print_header() {
    echo ""
    echo "=========================================="
    echo "  $1"
    echo "=========================================="
    echo ""
}

test_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASS++))
}

test_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAIL++))
}

test_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARN++))
}

test_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Main validation
print_header "Email Automation Deployment Validation"

echo "Checking system configuration..."
echo ""

# Test 1: Check Environment Files
print_header "1. Configuration Files"

if [ -f "tracking-server/.env" ]; then
    test_pass "tracking-server/.env exists"

    # Check required variables
    source tracking-server/.env

    if [ -n "$N8N_BASE_URL" ] && [ "$N8N_BASE_URL" != "https://your-n8n-instance.app.n8n.cloud" ]; then
        test_pass "N8N_BASE_URL configured"
    else
        test_fail "N8N_BASE_URL not properly configured"
    fi

    if [ -n "$WEBHOOK_SECRET" ] && [ "$WEBHOOK_SECRET" != "your-random-secure-string" ] && [ ${#WEBHOOK_SECRET} -ge 32 ]; then
        test_pass "WEBHOOK_SECRET configured (${#WEBHOOK_SECRET} characters)"
    else
        test_fail "WEBHOOK_SECRET not properly configured (should be 32+ characters)"
    fi

    if [ -n "$PORT" ]; then
        test_pass "PORT configured: $PORT"
        TRACKING_PORT=$PORT
    else
        test_warn "PORT not set, will use default 3000"
        TRACKING_PORT=3000
    fi
else
    test_fail "tracking-server/.env not found"
    test_info "Run: ./scripts/setup-wizard.sh"
fi

if [ -f "config/system-config.json" ]; then
    test_pass "config/system-config.json exists"

    # Validate JSON
    if command -v jq >/dev/null 2>&1; then
        if jq empty config/system-config.json 2>/dev/null; then
            test_pass "system-config.json is valid JSON"
        else
            test_fail "system-config.json has invalid JSON syntax"
        fi
    else
        test_warn "jq not installed, skipping JSON validation"
    fi
else
    test_fail "config/system-config.json not found"
fi

# Test 2: Check Dependencies
print_header "2. Dependencies"

if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    test_pass "Node.js installed: $NODE_VERSION"

    # Check version is 18+
    NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        test_pass "Node.js version is 18+ (required)"
    else
        test_fail "Node.js version must be 18+ (current: $NODE_VERSION)"
    fi
else
    test_fail "Node.js not installed"
fi

if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm -v)
    test_pass "npm installed: $NPM_VERSION"
else
    test_fail "npm not installed"
fi

if [ -d "tracking-server/node_modules" ]; then
    test_pass "tracking-server dependencies installed"
else
    test_warn "tracking-server dependencies not installed"
    test_info "Run: cd tracking-server && npm install"
fi

# Test 3: Tracking Server
print_header "3. Tracking Server"

# Check if server is running
if curl -f -s http://localhost:${TRACKING_PORT:-3000}/health > /dev/null 2>&1; then
    test_pass "Tracking server is running on port ${TRACKING_PORT:-3000}"

    # Get health check response
    HEALTH_RESPONSE=$(curl -s http://localhost:${TRACKING_PORT:-3000}/health)
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        test_pass "Health check returns OK status"
    else
        test_warn "Health check returned unexpected response"
    fi

    # Check endpoints
    if curl -f -s -I http://localhost:${TRACKING_PORT:-3000}/track/pixel | grep -q "200 OK"; then
        test_pass "Pixel endpoint accessible"
    else
        test_warn "Pixel endpoint returned unexpected status"
    fi
else
    test_fail "Tracking server not running on port ${TRACKING_PORT:-3000}"
    test_info "Start with: cd tracking-server && npm start"
    test_info "Or deploy with: ./scripts/deploy-production.sh"
fi

# Test 4: Network and Firewall
print_header "4. Network & Firewall"

# Check if port is listening
if command -v netstat >/dev/null 2>&1; then
    if netstat -tuln 2>/dev/null | grep -q ":${TRACKING_PORT:-3000}"; then
        test_pass "Port ${TRACKING_PORT:-3000} is listening"
    else
        test_fail "Port ${TRACKING_PORT:-3000} is not listening"
    fi
elif command -v ss >/dev/null 2>&1; then
    if ss -tuln 2>/dev/null | grep -q ":${TRACKING_PORT:-3000}"; then
        test_pass "Port ${TRACKING_PORT:-3000} is listening"
    else
        test_fail "Port ${TRACKING_PORT:-3000} is not listening"
    fi
else
    test_warn "Cannot check port status (netstat/ss not available)"
fi

# Check firewall
if command -v ufw >/dev/null 2>&1; then
    if sudo ufw status 2>/dev/null | grep -q "${TRACKING_PORT:-3000}"; then
        test_pass "Port ${TRACKING_PORT:-3000} allowed in firewall"
    else
        test_warn "Port ${TRACKING_PORT:-3000} may not be allowed in firewall"
        test_info "Run: sudo ufw allow ${TRACKING_PORT:-3000}/tcp"
    fi
fi

# Test 5: Google Sheets Setup
print_header "5. Google Sheets Configuration"

if [ -f "google-apps-script/Code.gs" ]; then
    test_pass "Apps Script code exists"

    # Check if code has necessary functions
    if grep -q "function onOpen" google-apps-script/Code.gs && \
       grep -q "function createCampaignFromDialog" google-apps-script/Code.gs && \
       grep -q "function validateFrequencyLimits" google-apps-script/Code.gs; then
        test_pass "All required functions present in Apps Script"
    else
        test_warn "Some functions may be missing from Apps Script"
    fi
else
    test_fail "Apps Script code not found"
fi

if [ -f "google-apps-script/CampaignDialog.html" ]; then
    test_pass "Campaign dialog HTML exists"
else
    test_fail "Campaign dialog HTML not found"
fi

if [ -f "config/google-sheets-schema.json" ]; then
    test_pass "Google Sheets schema documentation exists"
    test_info "Use this file to create your sheets structure"
else
    test_warn "Google Sheets schema documentation not found"
fi

# Test 6: Airtable Setup
print_header "6. Airtable Configuration"

if [ -f "config/airtable-schema.json" ]; then
    test_pass "Airtable schema documentation exists"
    test_info "Use this file to create your Airtable base"
else
    test_warn "Airtable schema documentation not found"
fi

# Cannot test Airtable connection without API credentials

# Test 7: n8n Workflows
print_header "7. n8n Workflows"

WORKFLOW_COUNT=$(ls -1 n8n-workflows/*.json 2>/dev/null | wc -l)

if [ "$WORKFLOW_COUNT" -eq 6 ]; then
    test_pass "All 6 workflow files present"

    # List workflows
    for workflow in n8n-workflows/*.json; do
        WORKFLOW_NAME=$(basename "$workflow")
        if [ -f "$workflow" ]; then
            # Validate JSON if jq is available
            if command -v jq >/dev/null 2>&1; then
                if jq empty "$workflow" 2>/dev/null; then
                    test_pass "$WORKFLOW_NAME is valid JSON"
                else
                    test_fail "$WORKFLOW_NAME has invalid JSON"
                fi
            else
                test_info "$WORKFLOW_NAME exists"
            fi
        fi
    done
else
    test_fail "Expected 6 workflows, found $WORKFLOW_COUNT"
fi

# Cannot test n8n connection without access to instance

# Test 8: Documentation
print_header "8. Documentation"

DOCS=("README.md" "QUICKSTART.md" "PROJECT_SUMMARY.md" "docs/ARCHITECTURE.md" "docs/TROUBLESHOOTING.md" "docs/WORKFLOWS.md")

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        test_pass "$(basename $doc) exists"
    else
        test_warn "$doc not found"
    fi
done

# Test 9: Docker Setup (if using Docker)
print_header "9. Docker Configuration (Optional)"

if [ -f "tracking-server/Dockerfile" ]; then
    test_pass "Dockerfile exists"

    if command -v docker >/dev/null 2>&1; then
        test_pass "Docker is installed"

        # Check if Docker is running
        if docker ps >/dev/null 2>&1; then
            test_pass "Docker daemon is running"

            # Check for running container
            if docker ps | grep -q "email-tracking"; then
                test_pass "email-tracking container is running"
            else
                test_info "email-tracking container not running (OK if not using Docker)"
            fi
        else
            test_warn "Docker daemon not running"
        fi
    else
        test_info "Docker not installed (OK if not using Docker deployment)"
    fi
else
    test_warn "Dockerfile not found"
fi

if [ -f "docker-compose.yml" ]; then
    test_pass "docker-compose.yml exists"
else
    test_warn "docker-compose.yml not found"
fi

# Test 10: Security
print_header "10. Security Checks"

# Check if .env files are in .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        test_pass ".env files are in .gitignore"
    else
        test_fail ".env files NOT in .gitignore (SECURITY RISK!)"
        test_info "Add '*.env' to .gitignore"
    fi

    if grep -q "config/.*config\.json" .gitignore || grep -q "system-config\.json" .gitignore; then
        test_pass "Config files are in .gitignore"
    else
        test_warn "Config files may not be in .gitignore"
    fi
else
    test_warn ".gitignore not found"
fi

# Check webhook secret strength
if [ -f "tracking-server/.env" ]; then
    source tracking-server/.env
    if [ ${#WEBHOOK_SECRET} -ge 64 ]; then
        test_pass "Webhook secret is strong (${#WEBHOOK_SECRET} characters)"
    elif [ ${#WEBHOOK_SECRET} -ge 32 ]; then
        test_warn "Webhook secret is adequate but could be stronger"
    else
        test_fail "Webhook secret is too weak (${#WEBHOOK_SECRET} characters, should be 32+)"
    fi
fi

# Final Summary
print_header "Validation Summary"

TOTAL=$((PASS + FAIL + WARN))

echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo ""

# Deployment readiness assessment
if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}✓ DEPLOYMENT READY!${NC}"
        echo "All tests passed. Your system is fully configured."
        exit 0
    else
        echo -e "${YELLOW}⚠ MOSTLY READY${NC}"
        echo "No failures, but $WARN warning(s) detected."
        echo "Review warnings above and address if necessary."
        exit 0
    fi
else
    echo -e "${RED}✗ NOT READY${NC}"
    echo "$FAIL test(s) failed. Please address the failures above."
    echo ""
    echo "Common solutions:"
    echo "  1. Run setup wizard: ./scripts/setup-wizard.sh"
    echo "  2. Install dependencies: cd tracking-server && npm install"
    echo "  3. Start tracking server: ./scripts/deploy-production.sh"
    echo "  4. Check documentation: README.md and QUICKSTART.md"
    exit 1
fi
