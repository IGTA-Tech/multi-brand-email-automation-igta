# Complete Deployment Guide

This guide provides comprehensive instructions for deploying the Multi-Brand Email Automation System to production.

**📋 For a step-by-step checklist, see: [DEVELOPER_CHECKLIST.md](../DEVELOPER_CHECKLIST.md)**

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Quick Start](#quick-start)
3. [Detailed Setup Instructions](#detailed-setup-instructions)
4. [Automated Tools](#automated-tools)
5. [Manual Configuration](#manual-configuration)
6. [Verification & Testing](#verification--testing)
7. [Production Launch](#production-launch)
8. [Maintenance & Monitoring](#maintenance--monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

### What's Already Done

✅ **Complete codebase** written and tested
✅ **All 6 n8n workflows** implemented
✅ **Tracking server** built and ready
✅ **Google Apps Script** written
✅ **Deployment automation** scripts created
✅ **Configuration wizards** built
✅ **Validation scripts** ready
✅ **Comprehensive documentation** (5 guides)

### What You Need to Do

☐ Sign up for required service accounts
☐ Provision server infrastructure
☐ Run automated setup scripts
☐ Configure databases (Google Sheets + Airtable)
☐ Import and configure n8n workflows
☐ Set up Lido email delivery
☐ Test the complete system
☐ Launch first production campaign

**Estimated Time**: 6-8 hours (first-time setup)
**Estimated Cost**: $115-175/month operating costs

---

## Quick Start

### 5-Minute Overview

```bash
# 1. Clone repository
git clone https://github.com/IGTA-Tech/multi-brand-email-automation-igta.git
cd multi-brand-email-automation-igta

# 2. Run setup wizard
chmod +x scripts/*.sh
./scripts/setup-wizard.sh

# 3. Deploy tracking server
./scripts/deploy-production.sh

# 4. Validate deployment
./scripts/validate-deployment.sh
```

Then:
- Configure Google Sheets (use `config/google-sheets-schema.json`)
- Configure Airtable (use `config/airtable-schema.json`)
- Import n8n workflows (see `config/n8n-credentials-helper.txt`)
- Set up Lido automations
- Test with sample campaign

---

## Detailed Setup Instructions

### Prerequisites

Before starting, ensure you have:

#### Required Accounts
- [ ] Google Workspace (minimum 1 account, recommended 5)
- [ ] Google Cloud Console project
- [ ] Airtable (Team or Business plan)
- [ ] Anthropic Claude API access
- [ ] n8n instance (cloud or self-hosted)
- [ ] Lido (Pro plan)
- [ ] VPS/Server for tracking (1GB RAM minimum)

#### Required Tools
- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Git installed
- [ ] SSH access to VPS
- [ ] Domain name with DNS control

#### Required Knowledge
- Basic command line usage
- DNS configuration
- Google Sheets basics
- Understanding of webhooks

---

## Automated Tools

We've created three automation scripts to simplify deployment:

### 1. Setup Wizard (`setup-wizard.sh`)

**Purpose**: Interactive configuration generator

**What it does**:
- ✅ Prompts for all required values
- ✅ Generates `tracking-server/.env`
- ✅ Creates `config/system-config.json`
- ✅ Generates secure webhook secrets
- ✅ Creates n8n credentials reference guide

**Usage**:
```bash
./scripts/setup-wizard.sh
```

**Time**: 10-15 minutes

**Output Files**:
- `tracking-server/.env` - Environment configuration
- `config/system-config.json` - System settings
- `config/n8n-credentials-helper.txt` - n8n setup guide
- `setup-summary-TIMESTAMP.txt` - Optional summary file

### 2. Deployment Script (`deploy-production.sh`)

**Purpose**: Automated tracking server deployment

**What it does**:
- ✅ Validates Node.js and dependencies
- ✅ Checks environment configuration
- ✅ Installs npm packages
- ✅ Tests tracking server
- ✅ Deploys using PM2, Docker, or systemd
- ✅ Configures firewall (optional)

**Usage**:
```bash
./scripts/deploy-production.sh
```

**Deployment Methods**:
1. **PM2** (Recommended) - Process manager with auto-restart
2. **Docker** - Containerized deployment
3. **systemd** - System service
4. **Manual** - Just install dependencies

**Time**: 10-15 minutes

### 3. Validation Script (`validate-deployment.sh`)

**Purpose**: Comprehensive system validation

**What it does**:
- ✅ Checks all configuration files
- ✅ Validates environment variables
- ✅ Tests tracking server health
- ✅ Verifies dependencies
- ✅ Checks network configuration
- ✅ Validates file structure
- ✅ Security checks
- ✅ Generates validation report

**Usage**:
```bash
./scripts/validate-deployment.sh
```

**Exit Codes**:
- `0` - All tests passed (ready for production)
- `1` - Some tests failed (needs attention)

**Time**: 2-3 minutes

---

## Manual Configuration

Some components require manual setup due to external dependencies:

### Google Sheets Setup

**Time**: 30-45 minutes

#### Step 1: Create Spreadsheet

1. Go to https://sheets.google.com
2. Create new spreadsheet: "Multi-Brand Email Automation Master"
3. Copy Spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

#### Step 2: Create Sheets

Create 6 sheets with these exact names:
1. Ultimate Contact Sheet
2. Send History Log
3. Campaign Queue
4. Brand Configuration
5. Template Library
6. Lido Send Queue

#### Step 3: Add Columns

Use `config/google-sheets-schema.json` as reference.

For each sheet:
- Add all columns as specified in schema
- Set column types (text, number, date, etc.)
- Add formulas for calculated columns
- Apply conditional formatting
- Set up data validation (dropdowns)

**Quick Example - Ultimate Contact Sheet**:
```
Columns: Contact ID | First Name | Last Name | Email | Lead Status | Lead Score | ...
Types:   Text        Text         Text        Email   Select        Number      ...
```

#### Step 4: Install Apps Script

1. In your spreadsheet: Extensions → Apps Script
2. Delete default code
3. Open `google-apps-script/Code.gs`
4. Copy entire contents
5. Paste into Apps Script editor
6. Save (Ctrl+S or disk icon)
7. Create new HTML file: File → New → HTML file
8. Name it: `CampaignDialog`
9. Copy contents of `google-apps-script/CampaignDialog.html`
10. Paste and save
11. Run `setupTriggers()` function
12. Grant all requested permissions
13. Refresh Google Sheets
14. Verify "Email Automation" menu appears

#### Step 5: Add Sample Data

**Ultimate Contact Sheet**:
```
Contact ID: C-TEST-001
First Name: Test
Last Name: User
Email: your-email@example.com
Lead Status: Hot Lead
Lead Score: 9
```

**Brand Configuration**:
```
Brand ID: BRD-001
Brand Name: Test Brand
Status: Active
From Email: hello@yourdomain.com
From Name: Your Team
```

### Airtable Setup

**Time**: 45-60 minutes

#### Step 1: Create Base

1. Go to https://airtable.com
2. Create new base: "Email Campaign Manager"
3. Copy Base ID from URL:
   ```
   https://airtable.com/[BASE_ID]/...
   ```

#### Step 2: Create Tables

Use `config/airtable-schema.json` as reference.

**Create in this order** (for proper linking):

1. **Brands** table
   - Primary field: Brand ID
   - Add all fields from schema
   - Create "Active Brands" view

2. **Contacts** table
   - Primary field: Contact ID
   - Add all fields
   - Link to Brands
   - Set up rollup fields
   - Create views: All, Hot Leads, Can Send

3. **Templates** table
   - Primary field: Template ID
   - Link to Brands
   - Create Active Templates view

4. **Campaigns** table
   - Primary field: Campaign ID
   - Link to Brands, Contacts, Templates
   - Set up rollups for metrics
   - Create views: Active, Performance Dashboard

5. **Campaign Queue** table
   - Primary field: Queue ID
   - Link to Campaigns, Contacts, Brands
   - Create Ready to Send view

6. **Send History** table
   - Primary field: Queue ID
   - Link to Contacts, Campaigns, Brands
   - Set up engagement formulas
   - Create views: All, Opened, High Engagement

#### Step 3: Configure Relationships

Set up linked record fields:
- Contacts → Brands (many-to-one)
- Campaigns → Brands (many-to-one)
- Campaigns → Contacts (many-to-many)
- Campaign Queue → Campaigns, Contacts, Brands
- Send History → Campaigns, Contacts, Brands

#### Step 4: Set Up Formulas

**Example formulas**:

**Contacts - Engagement Score**:
```
({Total Opens} * 5) + ({Total Clicks} * 10) + ({Total Replies} * 15)
```

**Campaigns - Open Rate %**:
```
IF({Total Sent} > 0, ROUND(({Total Opened} / {Total Sent}) * 100, 1), 0)
```

**Send History - Engagement Score**:
```
({Open Count} * 10) + ({Click Count} * 20) + ({Reply Count} * 30)
```

#### Step 5: Create Views

For each table, create views with:
- Filters (e.g., Status = "Active")
- Sorts (e.g., by Lead Score descending)
- Field visibility (hide internal fields)
- Grouping (optional)

### n8n Workflow Setup

**Time**: 45-60 minutes

#### Step 1: Add Credentials

In n8n: Settings → Credentials

**Google Sheets OAuth2**:
1. Add Credential → Google OAuth2
2. Name: "Google Sheets OAuth2"
3. Client ID: (from Google Cloud Console)
4. Client Secret: (from Google Cloud Console)
5. Scopes: `https://www.googleapis.com/auth/spreadsheets`
6. Complete OAuth flow

**Airtable Personal Access Token**:
1. Add Credential → Airtable Personal Access Token
2. Name: "Airtable Personal Access Token"
3. Token: (from airtable.com/account)

**Anthropic API**:
1. Add Credential → Anthropic API
2. Name: "Anthropic API"
3. API Key: (from console.anthropic.com)

**HTTP Header Auth** (for webhooks):
1. Add Credential → HTTP Header Auth
2. Name: "Webhook Auth"
3. Header Name: `Authorization`
4. Header Value: `Bearer {your_webhook_secret}` (from .env)

#### Step 2: Import Workflows

For each workflow file in `n8n-workflows/`:

1. In n8n: Settings → Import from File
2. Select workflow JSON file
3. Click Import
4. Workflow opens in editor

#### Step 3: Configure Each Workflow

**For ALL workflows**:
- Replace `YOUR_N8N_DOMAIN` with your n8n URL
- Replace `YOUR_AIRTABLE_BASE_ID` with your Base ID
- Replace `YOUR_TRACKING_DOMAIN` with tracking domain
- Replace Document ID with your Sheets ID
- Select appropriate credentials for each node

**Workflow 1 - Contact Sync**:
- Google Sheets nodes → Select credential
- Update Spreadsheet ID
- Airtable nodes → Select credential
- Update Base ID and table names
- Test: Run manually, check execution log

**Workflow 2 - Campaign Init**:
- All Google Sheets/Airtable nodes → Credentials
- Update configuration values
- Copy webhook URL
- Add to Apps Script CONFIG object

**Workflow 3 - Execute Queue**:
- Configure all data source nodes
- Update tracking domain for pixel generation
- Test frequency validation logic

**Workflow 4 - Track Opens**:
- Configure webhook auth
- Update Sheets/Airtable connections
- Copy webhook URL for tracking server

**Workflow 5 - Claude Generation**:
- Add Anthropic credential
- Test with sample contact data
- Verify JSON parsing works

**Workflow 6 - Auto-Pilot**:
- Configure all connections
- Set desired stale lead criteria
- Test lead identification logic

#### Step 4: Activate Workflows

For each workflow:
1. Save changes
2. Toggle "Active" switch ON
3. Verify no errors in execution log

### Lido Setup

**Time**: 30 minutes

#### Step 1: Connect Gmail Accounts

1. Log into Lido
2. Settings → Integrations
3. Connect Google Workspace accounts
4. Grant Gmail sending permissions
5. Verify all accounts connected

#### Step 2: Import Spreadsheet

1. Click "Import Spreadsheet"
2. Select your Google Sheets file
3. Grant read/write permissions
4. Verify all 6 sheets visible

#### Step 3: Create Send Automation

1. New Automation
2. Name: "Send Email from Queue"
3. Trigger: New row in "Lido Send Queue"
4. Action: Send email via Gmail
5. Map columns:
   - To: {To Email}
   - Subject: {Subject}
   - Body HTML: {Body HTML}
   - From: {From Email}
   - From Name: {From Name}
   - Reply To: {Reply To}
6. Test with sample row
7. Activate automation

#### Step 4: Configure Webhooks

**Send Confirmation**:
- Add action after send
- HTTP Request
- URL: `{n8n_url}/webhook/email-sent`
- Method: POST
- Headers: `Authorization: Bearer {secret}`
- Body: Include Queue ID, status

---

## Verification & Testing

### Pre-Launch Checklist

Run validation script:
```bash
./scripts/validate-deployment.sh
```

Should see:
- ✅ All configuration files present
- ✅ Environment variables set
- ✅ Tracking server healthy
- ✅ Dependencies installed
- ✅ Security checks passed

### Test Each Component

#### Test 1: Contact Sync (WF1)
```
1. Add test contact in Google Sheets
2. Trigger WF1 manually in n8n
3. Check execution log
4. Verify contact in Airtable
```

#### Test 2: Campaign Creation (WF2)
```
1. Sheets: Email Automation → Create Campaign
2. Fill form with test data
3. Submit
4. Check Campaign Queue sheet
5. Verify entry in Airtable
```

#### Test 3: Queue Execution (WF3)
```
1. Wait 5 minutes (or trigger manually)
2. Check WF3 execution log
3. Verify entry in Lido Send Queue
4. Confirm tracking pixel inserted
```

#### Test 4: Email Sending
```
1. Lido automation should trigger
2. Email delivered to test address
3. Open the email
4. Verify tracking pixel loads
```

#### Test 5: Open Tracking (WF4)
```
1. Open test email
2. Wait 30 seconds
3. Check WF4 execution log
4. Verify open recorded in Send History
5. Check engagement score updated
```

#### Test 6: Claude Generation (WF5)
```
1. Create campaign with Message Mode: Claude AI
2. Check WF5 execution log
3. Verify email generated
4. Review content quality
```

### Success Criteria

System is ready for production when:
- [ ] All 6 workflows active with no errors
- [ ] Test campaign sent successfully
- [ ] Email received in inbox
- [ ] Open tracked correctly
- [ ] Frequency validation working
- [ ] No security vulnerabilities
- [ ] Monitoring configured

---

## Production Launch

### Import Real Data

**Contacts**:
1. Export from current system (CSV)
2. Clean and format data
3. Map to Ultimate Contact Sheet columns
4. Import via Google Sheets
5. Run contact sync
6. Verify in Airtable

**Brands**:
1. Add real brands to Brand Configuration
2. Include all required fields
3. Configure voice guidelines
4. Add email signatures
5. Set sending limits

**Templates**:
1. Create templates in Template Library
2. For each brand, add:
   - Initial outreach
   - Follow-up
   - Re-engagement
3. Test variable replacement

### Create First Campaign

1. Select small test audience (10-20 contacts)
2. Choose appropriate brand
3. Select message mode
4. Write or generate content
5. Review frequency validation
6. Schedule strategically
7. Submit campaign
8. Monitor closely

### Monitor First 24 Hours

- Watch for errors in workflows
- Check email delivery rate
- Monitor open rates
- Track engagement
- Note any issues
- Gather team feedback

---

## Maintenance & Monitoring

### Daily Tasks
- Check workflow execution logs
- Review failed sends
- Monitor bounce rates
- Track engagement trends

### Weekly Tasks
- Review campaign performance
- Clean bounced contacts
- Update templates based on performance
- Check API usage and costs

### Monthly Tasks
- Audit contact data quality
- Review and optimize workflows
- Analyze ROI metrics
- Plan improvements

### Monitoring Setup

**Uptime Monitoring**:
```
Service: UptimeRobot or Pingdom
Monitor: https://track.yourdomain.com/health
Alert: Email on downtime
```

**Error Alerts**:
```
n8n: Configure workflow error notifications
Email: Send to team@yourdomain.com
Slack: Optional integration
```

**Backups**:
```
Google Sheets: Daily auto-backup
Airtable: Weekly CSV export
Workflows: Version control in Git
```

---

## Troubleshooting

### Common Issues

**"Email Automation menu not showing"**:
- Solution: Refresh page, run `onOpen()` manually

**"Tracking server not responding"**:
- Check: `pm2 logs email-tracking`
- Restart: `pm2 restart email-tracking`

**"n8n workflow fails"**:
- Check execution log for errors
- Verify credentials not expired
- Confirm API quotas not exceeded

**"Emails not sending"**:
- Check Lido automation is active
- Verify Gmail permissions granted
- Review Lido Send Queue for errors

**"Opens not tracking"**:
- Verify tracking server running
- Check pixel URL format
- Confirm webhook configured

For detailed troubleshooting, see: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Additional Resources

### Documentation
- **Quick Start**: [QUICKSTART.md](../QUICKSTART.md)
- **Developer Checklist**: [DEVELOPER_CHECKLIST.md](../DEVELOPER_CHECKLIST.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Workflows**: [WORKFLOWS.md](./WORKFLOWS.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Configuration Files
- **Google Sheets Schema**: `config/google-sheets-schema.json`
- **Airtable Schema**: `config/airtable-schema.json`
- **System Config**: `config/system-config.json`
- **Environment**: `tracking-server/.env`

### Scripts
- **Setup Wizard**: `./scripts/setup-wizard.sh`
- **Deploy**: `./scripts/deploy-production.sh`
- **Validate**: `./scripts/validate-deployment.sh`

### Support
- **GitHub Issues**: https://github.com/IGTA-Tech/multi-brand-email-automation-igta/issues
- **Email**: support@igtatech.com

---

**Last Updated**: 2025-10-22
**Version**: 1.0
**Maintained By**: IGTA Tech Team
