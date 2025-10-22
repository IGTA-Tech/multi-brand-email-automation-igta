#!/bin/bash

# Multi-Brand Email Automation - Interactive Setup Wizard
# This wizard guides you through the initial configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Functions
print_header() {
    echo ""
    echo -e "${CYAN}=========================================="
    echo -e "  $1"
    echo -e "==========================================${NC}"
    echo ""
}

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_step() { echo -e "${CYAN}▶${NC} $1"; }

# Generate random secret
generate_secret() {
    openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32
}

# Validate email
validate_email() {
    if [[ "$1" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Validate URL
validate_url() {
    if [[ "$1" =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Main wizard
print_header "Email Automation Setup Wizard"

echo "This wizard will help you configure your email automation system."
echo "Press CTRL+C at any time to cancel."
echo ""

read -p "Press Enter to continue..."

# Step 1: Tracking Server Configuration
print_header "Step 1/7: Tracking Server Configuration"

print_step "Tracking server will handle open/click tracking"
echo ""

read -p "Enter tracking server port (default: 3000): " TRACKING_PORT
TRACKING_PORT=${TRACKING_PORT:-3000}

read -p "Enter tracking server domain (e.g., track.yourdomain.com): " TRACKING_DOMAIN
while [ -z "$TRACKING_DOMAIN" ]; do
    print_warning "Tracking domain is required"
    read -p "Enter tracking server domain: " TRACKING_DOMAIN
done

TRACKING_URL="https://$TRACKING_DOMAIN"
print_success "Tracking server: $TRACKING_URL"

# Step 2: n8n Configuration
print_header "Step 2/7: n8n Configuration"

print_step "n8n handles all workflow automation"
echo ""

read -p "Enter n8n instance URL (e.g., https://n8n.yourdomain.com): " N8N_URL
while ! validate_url "$N8N_URL"; do
    print_warning "Invalid URL format (must start with https://)"
    read -p "Enter n8n instance URL: " N8N_URL
done

print_success "n8n instance: $N8N_URL"

# Step 3: Webhook Security
print_header "Step 3/7: Webhook Security"

print_step "Generating secure webhook secret..."
WEBHOOK_SECRET=$(generate_secret)
print_success "Generated webhook secret"
echo ""
print_info "Save this secret for n8n configuration:"
echo -e "${YELLOW}$WEBHOOK_SECRET${NC}"
echo ""

read -p "Press Enter to continue..."

# Step 4: Google Sheets Configuration
print_header "Step 4/7: Google Sheets Configuration"

print_step "Enter your Google Sheets information"
echo ""
print_info "Tip: Find Spreadsheet ID in the URL:"
print_info "https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit"
echo ""

read -p "Enter Google Sheets Spreadsheet ID: " SHEETS_ID
while [ -z "$SHEETS_ID" ]; do
    print_warning "Spreadsheet ID is required"
    read -p "Enter Google Sheets Spreadsheet ID: " SHEETS_ID
done

print_success "Google Sheets ID: $SHEETS_ID"

# Step 5: Airtable Configuration
print_header "Step 5/7: Airtable Configuration"

print_step "Enter your Airtable information"
echo ""
print_info "Tip: Find Base ID in the URL:"
print_info "https://airtable.com/[BASE_ID]/..."
echo ""

read -p "Enter Airtable Base ID (starts with 'app'): " AIRTABLE_BASE_ID
while [[ ! "$AIRTABLE_BASE_ID" =~ ^app ]]; do
    print_warning "Base ID should start with 'app'"
    read -p "Enter Airtable Base ID: " AIRTABLE_BASE_ID
done

echo ""
print_info "Get Personal Access Token from: https://airtable.com/account"
read -p "Enter Airtable Personal Access Token: " AIRTABLE_TOKEN
while [ -z "$AIRTABLE_TOKEN" ]; do
    print_warning "Access token is required"
    read -p "Enter Airtable Personal Access Token: " AIRTABLE_TOKEN
done

print_success "Airtable configured"

# Step 6: Anthropic Claude API
print_header "Step 6/7: Anthropic Claude API"

print_step "Enter your Anthropic API key for Claude"
echo ""
print_info "Get API key from: https://console.anthropic.com/settings/keys"
echo ""

read -p "Enter Anthropic API Key: " ANTHROPIC_KEY
while [ -z "$ANTHROPIC_KEY" ]; do
    print_warning "API key is required"
    read -p "Enter Anthropic API Key: " ANTHROPIC_KEY
done

print_success "Claude API configured"

# Step 7: Lido Configuration (Optional)
print_header "Step 7/7: Lido Configuration (Optional)"

print_step "Lido handles email sending via Gmail API"
echo ""

read -p "Do you have a Lido account set up? [y/N]: " HAS_LIDO

if [ "$HAS_LIDO" = "y" ] || [ "$HAS_LIDO" = "Y" ]; then
    read -p "Enter Lido webhook URL (for send confirmations): " LIDO_WEBHOOK
    LIDO_CONFIGURED="yes"
    print_success "Lido configured"
else
    LIDO_WEBHOOK=""
    LIDO_CONFIGURED="no"
    print_warning "Lido not configured - you'll need to set this up later"
fi

# Generate configuration files
print_header "Generating Configuration Files"

print_step "Creating tracking-server/.env..."

cat > tracking-server/.env <<EOF
# Tracking Server Configuration
PORT=$TRACKING_PORT
NODE_ENV=production

# n8n Integration
N8N_BASE_URL=$N8N_URL
WEBHOOK_SECRET=$WEBHOOK_SECRET

# Tracking Domain
TRACKING_DOMAIN=$TRACKING_DOMAIN
TRACKING_BASE_URL=$TRACKING_URL

# Security
CORS_ORIGIN=$N8N_URL

# Optional: Logging
LOG_LEVEL=info
EOF

print_success "Created tracking-server/.env"

# Generate system config
print_step "Creating config/system-config.json..."

cat > config/system-config.json <<EOF
{
  "googleSheets": {
    "spreadsheetId": "$SHEETS_ID",
    "sheetNames": {
      "contacts": "Ultimate Contact Sheet",
      "sendHistory": "Send History Log",
      "campaignQueue": "Campaign Queue",
      "brands": "Brand Configuration",
      "templates": "Template Library",
      "lidoQueue": "Lido Send Queue"
    }
  },
  "airtable": {
    "baseId": "$AIRTABLE_BASE_ID",
    "tables": {
      "contacts": "Contacts",
      "brands": "Brands",
      "campaigns": "Campaigns",
      "campaignQueue": "Campaign Queue",
      "templates": "Templates",
      "sendHistory": "Send History"
    }
  },
  "n8n": {
    "baseUrl": "$N8N_URL",
    "webhooks": {
      "createCampaign": "/webhook/create-campaign",
      "emailOpened": "/webhook/email-opened",
      "emailClicked": "/webhook/email-clicked",
      "generateEmail": "/webhook/generate-email"
    }
  },
  "trackingServer": {
    "url": "$TRACKING_URL",
    "port": $TRACKING_PORT,
    "endpoints": {
      "trackPixel": "/track/pixel",
      "trackClick": "/track/click",
      "health": "/health"
    }
  },
  "anthropic": {
    "model": "claude-sonnet-4-20250514"
  },
  "lido": {
    "configured": $LIDO_CONFIGURED,
    "webhookUrl": "$LIDO_WEBHOOK"
  },
  "security": {
    "webhookSecret": "$WEBHOOK_SECRET"
  },
  "frequencyLimits": {
    "hardLimits": {
      "hours24": 1,
      "days7": 3,
      "days30": 10
    },
    "engagementModifiers": {
      "high": {
        "threshold": 70,
        "days7": 4,
        "days30": 15
      },
      "low": {
        "threshold": 20,
        "days7": 2,
        "days30": 7
      }
    }
  },
  "workspaces": [
    {
      "id": "workspace1",
      "name": "Workspace 1",
      "email": "workspace1@yourdomain.com",
      "maxEmailsPerDay": 500,
      "status": "active"
    }
  ]
}
EOF

print_success "Created config/system-config.json"

# Create n8n credentials helper file
print_step "Creating n8n-credentials-helper.txt..."

cat > config/n8n-credentials-helper.txt <<EOF
# n8n Credentials Configuration Guide

## 1. Google Sheets OAuth2
Settings → Credentials → Add Credential
- Type: Google OAuth2
- Name: Google Sheets OAuth2
- Scope: https://www.googleapis.com/auth/spreadsheets
- Follow OAuth flow to authenticate

## 2. Airtable Personal Access Token
Settings → Credentials → Add Credential
- Type: Airtable Personal Access Token
- Name: Airtable Personal Access Token
- Token: $AIRTABLE_TOKEN

## 3. Anthropic API
Settings → Credentials → Add Credential
- Type: Anthropic API
- Name: Anthropic API
- API Key: $ANTHROPIC_KEY

## 4. HTTP Header Auth (Webhook Security)
Settings → Credentials → Add Credential
- Type: HTTP Header Auth
- Name: Webhook Auth
- Header Name: Authorization
- Header Value: Bearer $WEBHOOK_SECRET

## Configuration in Workflows

After adding credentials, update each workflow:

### Workflow 1-6: Update Configuration
1. Open each workflow
2. Click on nodes that require credentials
3. Select the appropriate credential from dropdown
4. Update these values:
   - Google Sheets Document ID: $SHEETS_ID
   - Airtable Base ID: $AIRTABLE_BASE_ID
   - n8n Base URL: $N8N_URL
   - Tracking Domain: $TRACKING_URL

## Next Steps
1. Import all workflows from n8n-workflows/
2. Configure credentials in each workflow
3. Activate workflows
4. Test with sample campaign
EOF

print_success "Created config/n8n-credentials-helper.txt"

# Summary
print_header "Setup Complete!"

echo -e "${GREEN}✓${NC} Configuration files generated successfully!"
echo ""
echo "Files created:"
echo "  - tracking-server/.env"
echo "  - config/system-config.json"
echo "  - config/n8n-credentials-helper.txt"
echo ""

print_warning "IMPORTANT: Keep these files secure!"
print_info "Add them to .gitignore to prevent committing secrets"
echo ""

print_header "Next Steps"

echo "1. Deploy Tracking Server:"
echo "   $ ./scripts/deploy-production.sh"
echo ""

echo "2. Set up Google Sheets:"
echo "   - Create spreadsheet from config/google-sheets-schema.json"
echo "   - Install Apps Script from google-apps-script/"
echo ""

echo "3. Set up Airtable:"
echo "   - Create base from config/airtable-schema.json"
echo "   - Configure relationships and views"
echo ""

echo "4. Configure n8n:"
echo "   - Add credentials (see config/n8n-credentials-helper.txt)"
echo "   - Import workflows from n8n-workflows/"
echo "   - Update configuration values in each workflow"
echo "   - Activate all workflows"
echo ""

echo "5. Set up Lido (if not done):"
echo "   - Connect Gmail accounts"
echo "   - Create send automation"
echo "   - Configure webhooks"
echo ""

echo "6. Validate deployment:"
echo "   $ ./scripts/validate-deployment.sh"
echo ""

print_info "Full documentation: README.md and QUICKSTART.md"
echo ""

# Optional: Save summary
read -p "Save setup summary to file? [y/N]: " SAVE_SUMMARY

if [ "$SAVE_SUMMARY" = "y" ] || [ "$SAVE_SUMMARY" = "Y" ]; then
    SUMMARY_FILE="setup-summary-$(date +%Y%m%d-%H%M%S).txt"

    cat > "$SUMMARY_FILE" <<EOF
Email Automation System - Setup Summary
Generated: $(date)

TRACKING SERVER
- Domain: $TRACKING_DOMAIN
- URL: $TRACKING_URL
- Port: $TRACKING_PORT

N8N
- URL: $N8N_URL
- Webhook Secret: $WEBHOOK_SECRET

GOOGLE SHEETS
- Spreadsheet ID: $SHEETS_ID

AIRTABLE
- Base ID: $AIRTABLE_BASE_ID
- Token: [HIDDEN - see config files]

ANTHROPIC
- API Key: [HIDDEN - see config files]

LIDO
- Configured: $LIDO_CONFIGURED
- Webhook: $LIDO_WEBHOOK

FILES CREATED
- tracking-server/.env
- config/system-config.json
- config/n8n-credentials-helper.txt

NEXT STEPS
1. Deploy tracking server
2. Set up Google Sheets
3. Set up Airtable
4. Configure n8n
5. Set up Lido
6. Validate deployment

For detailed instructions, see:
- README.md
- QUICKSTART.md
- docs/WORKFLOWS.md
EOF

    print_success "Setup summary saved to: $SUMMARY_FILE"
    print_warning "This file contains sensitive information - keep it secure!"
fi

echo ""
print_success "Setup wizard complete!"
echo ""
