# Developer Implementation Checklist

This checklist outlines all steps required to deploy the Multi-Brand Email Automation System to production. Items are organized by priority and grouped by what has been automated vs. what requires manual setup.

**Estimated Total Time**: 4-6 hours

---

## ✅ Already Completed (Automated)

These components are already built and ready to use:

- [x] Complete codebase written and tested
- [x] All 6 n8n workflows created
- [x] Tracking server implemented
- [x] Google Apps Script written
- [x] Frontend demo built
- [x] Comprehensive documentation (5 guides)
- [x] Deployment scripts created
- [x] Configuration wizards built
- [x] Validation scripts ready
- [x] Docker configuration complete
- [x] Schema documentation for databases
- [x] Code pushed to GitHub

**Repository**: https://github.com/IGTA-Tech/multi-brand-email-automation-igta

---

## 📋 Phase 1: Prerequisites & Accounts (60-90 minutes)

### Sign Up for Required Services

#### ☐ 1.1 Google Workspace Accounts
**Time**: 15 minutes
**Cost**: $6/month per account (minimum 1, recommended 5)

- [ ] Sign up at: https://workspace.google.com
- [ ] Verify domain ownership
- [ ] Create 1-5 workspace accounts
- [ ] Note down credentials

**Accounts to create**:
- workspace1@yourdomain.com
- workspace2@yourdomain.com (optional but recommended)
- workspace3@yourdomain.com (optional)
- workspace4@yourdomain.com (optional)
- workspace5@yourdomain.com (optional)

#### ☐ 1.2 Google Cloud Console Setup
**Time**: 15 minutes
**Cost**: Free

- [ ] Go to: https://console.cloud.google.com
- [ ] Create new project: "Email Automation"
- [ ] Enable Google Sheets API
- [ ] Enable Gmail API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs for n8n
- [ ] Save Client ID and Client Secret

**APIs to enable**:
```
Google Sheets API
Gmail API
```

#### ☐ 1.3 Airtable Account
**Time**: 10 minutes
**Cost**: $20/month (Team plan)

- [ ] Sign up at: https://airtable.com/signup
- [ ] Upgrade to Team or Business plan
- [ ] Go to https://airtable.com/account
- [ ] Create Personal Access Token
- [ ] Select scopes: `data.records:read`, `data.records:write`, `schema.bases:read`
- [ ] Save token securely

#### ☐ 1.4 Anthropic Claude API
**Time**: 10 minutes
**Cost**: ~$20/month (usage-based)

- [ ] Sign up at: https://console.anthropic.com
- [ ] Add payment method
- [ ] Go to Settings → API Keys
- [ ] Create new API key
- [ ] Save key securely

#### ☐ 1.5 n8n Instance
**Time**: 15 minutes
**Cost**: $50/month (n8n.cloud) OR $10-20/month (self-hosted VPS)

**Option A: n8n Cloud** (Recommended for beginners)
- [ ] Sign up at: https://n8n.cloud
- [ ] Choose a plan (Pro or higher recommended)
- [ ] Note your instance URL (e.g., https://yourname.app.n8n.cloud)

**Option B: Self-hosted** (For advanced users)
- [ ] Provision VPS (DigitalOcean, AWS, etc.)
- [ ] Install Docker and Docker Compose
- [ ] Follow n8n self-hosting guide: https://docs.n8n.io/hosting/
- [ ] Set up domain and SSL
- [ ] Note your instance URL

####  ☐ 1.6 Lido Account
**Time**: 15 minutes
**Cost**: $30/month (Pro plan)

- [ ] Sign up at: https://lido.app/signup
- [ ] Choose Pro plan
- [ ] Connect Google Workspace accounts
- [ ] Grant Gmail sending permissions

#### ☐ 1.7 Server/VPS for Tracking
**Time**: 10 minutes
**Cost**: $5-20/month

**Providers** (choose one):
- DigitalOcean: https://digitalocean.com
- Linode: https://linode.com
- AWS Lightsail: https://aws.amazon.com/lightsail
- Vultr: https://vultr.com

**Requirements**:
- [ ] Ubuntu 22.04 LTS
- [ ] 1GB RAM minimum (2GB recommended)
- [ ] 25GB disk space
- [ ] Public IP address
- [ ] SSH access

---

## 📋 Phase 2: Infrastructure Setup (60-90 minutes)

### ☐ 2.1 Domain & DNS Configuration
**Time**: 30 minutes

- [ ] Purchase domain (if not already owned)
- [ ] Add A record for tracking server: `track.yourdomain.com → SERVER_IP`
- [ ] Add A record for n8n (if self-hosting): `n8n.yourdomain.com → N8N_IP`
- [ ] Wait for DNS propagation (15-30 minutes)
- [ ] Verify with: `nslookup track.yourdomain.com`

### ☐ 2.2 SSL/TLS Certificates
**Time**: 15 minutes

**Using Let's Encrypt** (Recommended):
```bash
# On your VPS
sudo apt update
sudo apt install certbot nginx
sudo certbot --nginx -d track.yourdomain.com
```

- [ ] Install Certbot
- [ ] Generate SSL certificate
- [ ] Configure auto-renewal
- [ ] Test HTTPS access

### ☐ 2.3 Clone Repository
**Time**: 5 minutes

```bash
# On your VPS
git clone https://github.com/IGTA-Tech/multi-brand-email-automation-igta.git
cd multi-brand-email-automation-igta
```

- [ ] Clone repository to VPS
- [ ] Verify all files present
- [ ] Check out master branch

### ☐ 2.4 Run Setup Wizard
**Time**: 10 minutes

```bash
chmod +x scripts/*.sh
./scripts/setup-wizard.sh
```

This wizard will prompt you for:
- [ ] Tracking server domain
- [ ] n8n instance URL
- [ ] Google Sheets ID (enter temporary value, update later)
- [ ] Airtable Base ID (enter temporary value, update later)
- [ ] Anthropic API key
- [ ] Lido configuration

**The wizard automatically generates**:
- ✅ `tracking-server/.env`
- ✅ `config/system-config.json`
- ✅ `config/n8n-credentials-helper.txt`

### ☐ 2.5 Deploy Tracking Server
**Time**: 15 minutes

```bash
./scripts/deploy-production.sh
```

- [ ] Select deployment method (PM2 recommended)
- [ ] Server starts successfully
- [ ] Health check passes
- [ ] Verify: `curl https://track.yourdomain.com/health`

### ☐ 2.6 Configure Firewall
**Time**: 10 minutes

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Tracking server (if not behind nginx)
sudo ufw enable
```

- [ ] Configure firewall rules
- [ ] Allow required ports
- [ ] Test external access

---

## 📋 Phase 3: Database Setup (90-120 minutes)

### ☐ 3.1 Create Google Sheets Spreadsheet
**Time**: 30 minutes

- [ ] Create new Google Spreadsheet
- [ ] Name it: "Multi-Brand Email Automation Master"
- [ ] Copy Spreadsheet ID from URL (between `/d/` and `/edit`)

**Create 6 sheets with exact names**:
- [ ] Ultimate Contact Sheet
- [ ] Send History Log
- [ ] Campaign Queue
- [ ] Brand Configuration
- [ ] Template Library
- [ ] Lido Send Queue

**Use `config/google-sheets-schema.json` as reference**:
- [ ] Add all columns for each sheet
- [ ] Set up formulas (for calculated columns)
- [ ] Apply conditional formatting
- [ ] Set up data validation (dropdowns)
- [ ] Add sample test data

**Sample test data to add**:

**Ultimate Contact Sheet**:
```
Contact ID: C-TEST-001
First Name: Test
Last Name: User
Email: your-email@example.com
Lead Status: Hot Lead
Lead Score: 9
Brand Association: BRD-001
```

**Brand Configuration**:
```
Brand ID: BRD-001
Brand Name: Test Brand
Status: Active
From Email: hello@yourdomain.com
From Name: Your Team
Brand Voice: Professional and friendly
```

### ☐ 3.2 Install Google Apps Script
**Time**: 15 minutes

- [ ] In Google Sheets: Extensions → Apps Script
- [ ] Delete default code
- [ ] Copy entire contents of `google-apps-script/Code.gs`
- [ ] Paste into Apps Script editor
- [ ] Click "Save" (disk icon)
- [ ] Create new HTML file: File → New → HTML file
- [ ] Name it: `CampaignDialog`
- [ ] Copy contents of `google-apps-script/CampaignDialog.html`
- [ ] Paste and save
- [ ] Run `setupTriggers()` function once
- [ ] Grant all permissions when prompted
- [ ] Refresh Google Sheets
- [ ] Verify "Email Automation" menu appears

### ☐ 3.3 Update Sheets ID in Configuration
**Time**: 5 minutes

```bash
# Update config/system-config.json
nano config/system-config.json
# Replace "YOUR_SHEETS_ID" with actual ID
```

- [ ] Open `config/system-config.json`
- [ ] Replace `spreadsheetId` with your actual Sheets ID
- [ ] Save file

### ☐ 3.4 Create Airtable Base
**Time**: 45 minutes

- [ ] Go to https://airtable.com
- [ ] Create new base: "Email Campaign Manager"
- [ ] Copy Base ID from URL (starts with `app`)

**Use `config/airtable-schema.json` as reference**

**Create tables in this order**:
1. [ ] **Brands** table
   - Add all fields from schema
   - Create "Active Brands" view

2. [ ] **Contacts** table
   - Add all fields from schema
   - Link to Brands table
   - Create views: "All Contacts", "Hot Leads", "Can Send Now"

3. [ ] **Templates** table
   - Add all fields from schema
   - Link to Brands table
   - Create "Active Templates" view

4. [ ] **Campaigns** table
   - Add all fields from schema
   - Link to Brands, Contacts, Templates
   - Set up rollup fields for metrics
   - Create "Active Campaigns" view

5. [ ] **Campaign Queue** table
   - Add all fields from schema
   - Link to Campaigns, Contacts, Brands
   - Create "Ready to Send" view

6. [ ] **Send History** table
   - Add all fields from schema
   - Link to Contacts, Campaigns, Brands
   - Set up rollup and formula fields
   - Create views: "All Sends", "Opened", "High Engagement"

**Add sample data**:
- [ ] Add test brand in Brands table (matching BRD-001 from Sheets)
- [ ] Add test contact in Contacts table
- [ ] Link contact to brand

### ☐ 3.5 Update Airtable ID in Configuration
**Time**: 5 minutes

```bash
nano config/system-config.json
# Replace "YOUR_AIRTABLE_BASE_ID" with actual ID
```

- [ ] Open `config/system-config.json`
- [ ] Replace `baseId` with your actual Base ID
- [ ] Save file

---

## 📋 Phase 4: n8n Workflow Setup (45-60 minutes)

### ☐ 4.1 Add Credentials to n8n
**Time**: 20 minutes

**Reference**: `config/n8n-credentials-helper.txt`

In n8n UI: Settings → Credentials

#### Add Google Sheets OAuth2
- [ ] Click "Add Credential"
- [ ] Type: Google OAuth2
- [ ] Name: "Google Sheets OAuth2"
- [ ] Client ID: (from Google Cloud Console)
- [ ] Client Secret: (from Google Cloud Console)
- [ ] Scopes: `https://www.googleapis.com/auth/spreadsheets`
- [ ] Complete OAuth flow
- [ ] Test connection

#### Add Airtable Token
- [ ] Click "Add Credential"
- [ ] Type: Airtable Personal Access Token
- [ ] Name: "Airtable Personal Access Token"
- [ ] Token: (from Airtable account settings)
- [ ] Test connection

#### Add Anthropic API
- [ ] Click "Add Credential"
- [ ] Type: Anthropic API
- [ ] Name: "Anthropic API"
- [ ] API Key: (from Anthropic console)
- [ ] Test connection

#### Add Webhook Auth
- [ ] Click "Add Credential"
- [ ] Type: HTTP Header Auth
- [ ] Name: "Webhook Auth"
- [ ] Header Name: `Authorization`
- [ ] Header Value: `Bearer YOUR_WEBHOOK_SECRET` (from .env file)

### ☐ 4.2 Import n8n Workflows
**Time**: 25 minutes

Import each workflow file from `n8n-workflows/`:

1. [ ] **01-contact-sync.json**
   - Import workflow
   - Update Google Sheets Document ID
   - Update Airtable Base ID
   - Select credentials for each node
   - Click "Save"
   - Toggle "Active" ON
   - Test manually

2. [ ] **02-campaign-initialization.json**
   - Import workflow
   - Update configuration values
   - Select credentials
   - Save and activate
   - Note webhook URL

3. [ ] **03-execute-queue.json**
   - Import workflow
   - Update configuration
   - Select credentials
   - Save and activate

4. [ ] **04-track-opens.json**
   - Import workflow
   - Update tracking domain
   - Select credentials
   - Save and activate
   - Note webhook URL

5. [ ] **05-claude-generation.json**
   - Import workflow
   - Select Anthropic credential
   - Save and activate
   - Note webhook URL

6. [ ] **06-auto-pilot.json**
   - Import workflow
   - Update configuration
   - Select credentials
   - Save and activate

**For each workflow**:
- [ ] Replace `YOUR_N8N_DOMAIN` with your n8n URL
- [ ] Replace `YOUR_AIRTABLE_BASE_ID` with your Base ID
- [ ] Replace `YOUR_TRACKING_DOMAIN` with your tracking domain
- [ ] Replace Document ID with your Sheets ID
- [ ] Assign appropriate credentials to each node

### ☐ 4.3 Update Apps Script Webhook URL
**Time**: 5 minutes

- [ ] Copy webhook URL from Workflow 2 (Campaign Init)
- [ ] Open Apps Script in Google Sheets
- [ ] Find the `CONFIG` object
- [ ] Update `N8N_BASE_URL` and `CREATE_CAMPAIGN_WEBHOOK`
- [ ] Save Apps Script

---

## 📋 Phase 5: Lido Configuration (30 minutes)

### ☐ 5.1 Import Spreadsheet to Lido
**Time**: 10 minutes

- [ ] Log into Lido
- [ ] Click "Import Spreadsheet"
- [ ] Select your Google Sheets file
- [ ] Grant permissions
- [ ] Verify all sheets visible

### ☐ 5.2 Create Send Automation
**Time**: 15 minutes

- [ ] Create new automation
- [ ] Name: "Send Email from Queue"
- [ ] Trigger: New row added in "Lido Send Queue" sheet
- [ ] Action: Send email via Gmail
- [ ] Map columns:
  - To: `{To Email}`
  - Subject: `{Subject}`
  - Body HTML: `{Body HTML}`
  - From: `{From Email}`
  - From Name: `{From Name}`
  - Reply To: `{Reply To}`
- [ ] Test with sample row
- [ ] Activate automation

### ☐ 5.3 Configure Lido Webhooks
**Time**: 5 minutes

**Email Sent Confirmation**:
- [ ] Add webhook action after send
- [ ] URL: `{n8n_url}/webhook/email-sent`
- [ ] Method: POST
- [ ] Headers: `Authorization: Bearer {webhook_secret}`
- [ ] Body: Include Queue ID, status, timestamp

**Open Tracking** (if Lido supports):
- [ ] Configure open tracking webhook
- [ ] URL: `{n8n_url}/webhook/email-opened`
- [ ] Method: POST

---

## 📋 Phase 6: Testing (30-45 minutes)

### ☐ 6.1 Run Validation Script
**Time**: 5 minutes

```bash
./scripts/validate-deployment.sh
```

- [ ] All configuration tests pass
- [ ] Tracking server is healthy
- [ ] Dependencies installed
- [ ] All files present
- [ ] Review and fix any failures

### ☐ 6.2 Test Contact Sync (Workflow 1)
**Time**: 10 minutes

- [ ] Add a test contact in Google Sheets
- [ ] Trigger Workflow 1 manually in n8n
- [ ] Check execution log (should succeed)
- [ ] Verify contact appears in Airtable
- [ ] Check all fields synced correctly

### ☐ 6.3 Test Campaign Creation (Workflow 2)
**Time**: 15 minutes

- [ ] In Google Sheets: Email Automation → Create Campaign
- [ ] Fill out form:
  - Brand: BRD-001 (Test Brand)
  - Contacts: C-TEST-001 (Test User)
  - Message Mode: Manual
  - Subject: "Test Campaign"
  - Body: "This is a test email"
  - Delivery Mode: Send Now
- [ ] Click "Create Campaign"
- [ ] Check Apps Script logs for success
- [ ] Verify entry in Campaign Queue sheet
- [ ] Check n8n Workflow 2 execution log
- [ ] Verify campaign created in Airtable

### ☐ 6.4 Test Queue Execution (Workflow 3)
**Time**: 10 minutes

- [ ] Wait 5 minutes (or trigger Workflow 3 manually)
- [ ] Check execution log
- [ ] Verify entry moved to Lido Send Queue
- [ ] Check tracking pixel was inserted
- [ ] Verify Lido automation triggered
- [ ] Receive test email in your inbox

### ☐ 6.5 Test Tracking (Workflow 4)
**Time**: 5 minutes

- [ ] Open the test email you received
- [ ] Verify pixel loaded (check browser network tab)
- [ ] Wait 30 seconds
- [ ] Check Workflow 4 execution log
- [ ] Verify open recorded in Send History
- [ ] Check Contact engagement score updated

### ☐ 6.6 Test Claude Generation (Workflow 5)
**Time**: 10 minutes

- [ ] Create new campaign in Google Sheets
- [ ] Choose Message Mode: "Claude AI"
- [ ] Provide campaign goal
- [ ] Submit
- [ ] Check Workflow 5 execution log
- [ ] Verify email generated
- [ ] Review quality of generated content
- [ ] Check cost (~$0.0065 per email)

---

## 📋 Phase 7: Production Readiness (30 minutes)

### ☐ 7.1 Import Real Contact Data
**Time**: 15 minutes

- [ ] Export contacts from current system (CSV format)
- [ ] Clean and format data
- [ ] Map columns to match schema
- [ ] Import into Google Sheets "Ultimate Contact Sheet"
- [ ] Run contact sync (Workflow 1)
- [ ] Verify data in Airtable
- [ ] Review for any issues

### ☐ 7.2 Configure Real Brands
**Time**: 10 minutes

- [ ] Add actual brands to Brand Configuration sheet
- [ ] Include:
  - Brand IDs (e.g., BRD-ELITE, BRD-AVENTUS)
  - From emails
  - Brand voice guidelines
  - Email signatures
  - Sending limits
- [ ] Sync to Airtable
- [ ] Verify brand data

### ☐ 7.3 Create Email Templates
**Time**: 10 minutes

- [ ] Add templates to Template Library sheet
- [ ] For each brand, create:
  - Initial outreach template
  - Follow-up template
  - Re-engagement template
- [ ] Include subject lines and bodies
- [ ] Define available variables
- [ ] Test variable replacement

### ☐ 7.4 Set Up Monitoring
**Time**: 10 minutes

**Health Check Monitoring**:
- [ ] Set up UptimeRobot or Pingdom
- [ ] Monitor: `https://track.yourdomain.com/health`
- [ ] Alert on downtime

**Error Alerts**:
- [ ] Configure n8n workflow error notifications
- [ ] Set up email alerts for failures
- [ ] Test alert delivery

**Backup Strategy**:
- [ ] Schedule daily Google Sheets backup
- [ ] Schedule weekly Airtable export
- [ ] Store backups securely

### ☐ 7.5 Security Checklist
**Time**: 10 minutes

- [ ] Verify `.env` files are in `.gitignore`
- [ ] Confirm config files not committed to git
- [ ] Rotate all API keys from testing
- [ ] Use strong webhook secrets (64+ characters)
- [ ] Enable 2FA on all accounts
- [ ] Limit VPS SSH access (key-only)
- [ ] Review firewall rules
- [ ] Set up automatic security updates

---

## 📋 Phase 8: Launch First Campaign (30 minutes)

### ☐ 8.1 Create Production Campaign
**Time**: 15 minutes

- [ ] Select target audience (start small: 10-20 contacts)
- [ ] Choose appropriate brand
- [ ] Pick message mode (template or Claude)
- [ ] Write or generate email content
- [ ] Review frequency validation
- [ ] Schedule for optimal send time
- [ ] Submit campaign

### ☐ 8.2 Monitor Campaign Performance
**Time**: 15 minutes

- [ ] Watch Campaign Queue processing
- [ ] Verify emails reaching Lido Send Queue
- [ ] Confirm emails being sent
- [ ] Monitor for bounces or errors
- [ ] Track open rates (first hour)
- [ ] Check click tracking
- [ ] Review engagement scores

### ☐ 8.3 Gather Feedback
- [ ] Note any issues encountered
- [ ] Document workarounds used
- [ ] List feature requests
- [ ] Share results with team

---

## 🎯 Success Criteria

Your system is production-ready when:

- [x] ✅ All 6 n8n workflows active and error-free
- [x] ✅ Tracking server responding to health checks
- [x] ✅ Google Sheets syncing to Airtable hourly
- [x] ✅ Apps Script menu visible and functional
- [x] ✅ Campaign creation succeeds without errors
- [x] ✅ Frequency validation blocking over-limit contacts
- [x] ✅ Emails sending via Lido successfully
- [x] ✅ Opens and clicks being tracked
- [x] ✅ Engagement scores calculating correctly
- [x] ✅ No security vulnerabilities
- [x] ✅ Monitoring and alerts configured
- [x] ✅ First production campaign sent successfully

---

## 📞 Support & Resources

### Documentation
- **Quick Start**: `QUICKSTART.md`
- **Full Documentation**: `README.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Workflows**: `docs/WORKFLOWS.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

### Scripts
- **Setup Wizard**: `./scripts/setup-wizard.sh`
- **Deploy**: `./scripts/deploy-production.sh`
- **Validate**: `./scripts/validate-deployment.sh`

### Schema References
- **Google Sheets**: `config/google-sheets-schema.json`
- **Airtable**: `config/airtable-schema.json`
- **System Config**: `config/system-config.json`

### Help
- **GitHub Issues**: https://github.com/IGTA-Tech/multi-brand-email-automation-igta/issues
- **Email Support**: support@igtatech.com

---

## 📊 Time & Cost Summary

### Total Implementation Time
- **Phase 1** (Accounts): 60-90 minutes
- **Phase 2** (Infrastructure): 60-90 minutes
- **Phase 3** (Databases): 90-120 minutes
- **Phase 4** (n8n): 45-60 minutes
- **Phase 5** (Lido): 30 minutes
- **Phase 6** (Testing): 30-45 minutes
- **Phase 7** (Production): 30 minutes
- **Phase 8** (Launch): 30 minutes

**Total: 6-8 hours** (first-time setup)

### Monthly Operating Costs
- Google Workspace (5 accounts): $30/month
- Airtable (Team plan): $20/month
- n8n Cloud OR VPS: $50/month OR $10-20/month
- Lido (Pro plan): $30/month
- Claude API: ~$20/month (usage-based)
- VPS (tracking server): $5-20/month
- Domain & SSL: ~$15/year ($1.25/month)

**Total**: ~$155-175/month (with n8n Cloud)
**Or**: ~$115-135/month (self-hosted n8n)

### Cost Optimization Options
- Self-host n8n: Save $40/month
- Use Gmail API directly instead of Lido: Save $30/month
- Reduce workspace accounts: Save $6/month per account
- Use templates instead of Claude: Reduce API costs

---

## ✨ What Happens After Completion

Once you complete this checklist, you'll have:

✅ Fully functional email automation system
✅ Multi-brand campaign management
✅ AI-powered email personalization
✅ Intelligent frequency controls
✅ Complete tracking and analytics
✅ Autonomous lead engagement (Auto-Pilot)
✅ Scalable infrastructure
✅ Production-grade security
✅ Comprehensive monitoring

**You'll be able to**:
- Send personalized emails to 100,000+ contacts
- Manage unlimited brands from one system
- Create AI-generated emails in seconds
- Never over-email contacts (automatic frequency limits)
- Track opens, clicks, and engagement
- Auto-engage stale leads daily
- Scale to 2,500+ emails per day

---

**Last Updated**: 2025-10-22
**Maintained By**: IGTA Tech Team
**Version**: 1.0
