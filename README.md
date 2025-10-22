# Multi-Brand Email Automation System - IGTA Version

A comprehensive, production-ready email automation system supporting multiple brands, workspaces, and intelligent AI-powered personalization.

![System Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

- **Multi-Brand Support**: Manage campaigns for 3+ brands from a single system
- **Multi-Workspace**: 5 Google Workspace accounts for distributed sending
- **AI-Powered Personalization**: Claude API integration for intelligent email generation
- **Intelligent Frequency Controls**: Automatic 24h/7d/30d limit enforcement
- **4 Delivery Modes**: Send Now, Scheduled, Recurring, Auto-Pilot
- **3 Message Modes**: Templates, Manual, Claude AI
- **Complete Tracking**: Opens, clicks, replies with real-time updates
- **Bi-directional Sync**: Google Sheets ↔ Airtable synchronization
- **Campaign Management**: Full lifecycle from creation to analytics

## 📋 Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Workflows](#workflows)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🏗 Architecture

The system consists of 5 interconnected layers:

1. **Data Storage Layer**: Google Sheets (master) + Airtable (relational)
2. **Automation Layer**: n8n workflows (6 core workflows)
3. **Intelligence Layer**: Claude API for personalization
4. **Delivery Layer**: Lido for email sending
5. **Validation Layer**: Frequency controls and compliance

```
User Input → n8n Campaign Init → Load Data → Validate Frequency →
Generate Messages (Claude) → Write to Queue → Lido Sends →
Track Opens/Clicks → Update All Systems
```

## 🛠 Technology Stack

### Core Services
- **Google Workspace** (5 accounts) - Email sending, data storage
- **Airtable** - Relational database, campaign management
- **n8n** (Self-hosted) - Workflow automation
- **Lido** - Email delivery and tracking
- **Claude API** (Sonnet 4) - AI email generation
- **Node.js/Express** - Tracking server

### APIs Used
- Google Sheets API
- Gmail API
- Airtable API
- Anthropic Claude API
- Lido Webhooks

## ✅ Prerequisites

Before installation, ensure you have:

1. **Google Workspace Accounts** (minimum 1, recommended 5)
   - Business Starter plan or higher
   - Admin access for API setup

2. **Airtable Account**
   - Team or Business plan
   - API access enabled

3. **n8n Instance**
   - Self-hosted on DigitalOcean/AWS (recommended)
   - OR n8n.cloud account

4. **Lido Account**
   - Pro plan
   - Gmail integration enabled

5. **Anthropic API Key**
   - Claude API access
   - Payment method on file

6. **Server/VPS** (for tracking server)
   - Node.js 18+
   - 1GB RAM minimum
   - SSL certificate

## 📦 Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/IGTA-Tech/multi-brand-email-automation-igta.git
cd multi-brand-email-automation-igta
```

### Step 2: Set Up Google Sheets

1. Copy the Google Sheets template:
   - [Template Link](#) (create from provided structure)

2. Create these sheets:
   - Ultimate Contact Sheet (46 columns)
   - Send History Log (25 columns)
   - Campaign Queue (20 columns)
   - Brand Configuration (25 columns)
   - Template Library (20 columns)
   - Lido Send Queue (22 columns)

3. Install Apps Script:
   ```bash
   # Open Google Sheets → Extensions → Apps Script
   # Copy contents from google-apps-script/Code.gs
   # Copy contents from google-apps-script/CampaignDialog.html
   # Save and deploy
   ```

4. Set up triggers:
   - Run `setupTriggers()` function
   - Verify hourly frequency count refresh

### Step 3: Configure Airtable

1. Create new Airtable base: "Email Campaign Manager"

2. Create tables:
   - Contacts (20 fields)
   - Brands (15 fields)
   - Campaigns (25 fields)
   - Campaign Queue (15 fields)
   - Templates (16 fields)
   - Send History (13 fields)

3. Set up views as specified in documentation

4. Get API credentials:
   ```bash
   # Go to airtable.com/account
   # Generate Personal Access Token
   # Copy Base ID from URL
   ```

### Step 4: Deploy n8n

#### Option A: Self-Hosted (Recommended)

```bash
# Install n8n via Docker
docker run -d --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Access at http://localhost:5678
```

#### Option B: n8n Cloud

```bash
# Sign up at n8n.cloud
# Create new instance
# Note down your instance URL
```

**Import Workflows:**

```bash
# In n8n UI:
# Settings → Import from File
# Import all 6 workflows from n8n-workflows/ directory
```

### Step 5: Deploy Tracking Server

```bash
cd tracking-server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Start server
npm start

# Or use PM2 for production
npm install -g pm2
pm2 start src/server.js --name email-tracking
pm2 save
pm2 startup
```

### Step 6: Configure Lido

1. Sign up at lido.app (Pro plan)

2. Import your Google Sheets spreadsheet

3. Connect Gmail accounts (all 5 workspaces)

4. Create automations:
   - **Send Email**: Trigger on new row in Lido Send Queue
   - **Track Opens**: Update on email open
   - **Track Clicks**: Update on link click

5. Set up webhooks:
   ```
   Open Tracking → POST to n8n /webhook/email-opened
   Click Tracking → POST to n8n /webhook/email-clicked
   Send Confirmation → POST to n8n /webhook/email-sent
   ```

## ⚙️ Configuration

### System Configuration

Edit `config/system-config.json`:

```json
{
  "googleSheets": {
    "spreadsheetId": "YOUR_ACTUAL_SPREADSHEET_ID"
  },
  "airtable": {
    "baseId": "YOUR_ACTUAL_BASE_ID"
  },
  "n8n": {
    "baseUrl": "https://your-n8n-domain.com"
  },
  "trackingServer": {
    "url": "https://your-tracking-domain.com"
  },
  "security": {
    "webhookSecret": "GENERATE_SECURE_RANDOM_STRING"
  }
}
```

### n8n Credentials

In n8n, add these credentials:

1. **Google OAuth2** (for Sheets)
   - Client ID & Secret from Google Cloud Console
   - Scopes: Sheets, Gmail

2. **Airtable Personal Access Token**
   - From airtable.com/account

3. **Anthropic API Key**
   - From console.anthropic.com

4. **HTTP Header Auth** (for webhooks)
   - Key: Authorization
   - Value: Bearer YOUR_SECRET_TOKEN

### Brand Configuration

In Google Sheets "Brand Configuration" tab:

| Brand ID | Brand Name | Active | From Email | Brand Voice |
|----------|------------|--------|------------|-------------|
| BRD-001  | Elite Sports Visas | ✓ | hello@brand.com | Professional yet encouraging... |

### Frequency Limits

Default limits (can be modified in code):

- **24 hours**: Maximum 1 email
- **7 days**: Maximum 3 emails
- **30 days**: Maximum 10 emails

Engagement-based modifiers:
- High engagement (70%+): Allow more frequent
- Low engagement (<20%): Reduce frequency

## 🚀 Usage

### Creating a Campaign

#### Option 1: Via Google Sheets UI

1. Open Google Sheets
2. Click **Email Automation → Create Campaign**
3. Fill out the form:
   - Select Brand
   - Choose Contacts
   - Pick Message Mode (Template/Manual/Claude)
   - Select Delivery Mode
4. Click **Create Campaign**

#### Option 2: Via API

```bash
curl -X POST https://your-n8n-domain.com/webhook/create-campaign \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "workspace1",
    "brandId": "BRD-001",
    "contactIds": ["C-001", "C-002"],
    "messageMode": "claude",
    "deliveryMode": "sendNow",
    "campaignName": "Q4 Follow-up Campaign"
  }'
```

### Message Modes

**1. Template Mode**
```
Use pre-built templates with variable replacement
Variables: {firstName}, {lastName}, {visaType}, {signature}
```

**2. Manual Mode**
```
Write custom subject and body
Full HTML support
Manual personalization
```

**3. Claude AI Mode**
```
AI-generated personalized emails
Context-aware based on lead status, engagement, history
Adapts tone to lead score
```

### Delivery Modes

**1. Send Now**
- Immediate delivery to all valid contacts
- Frequency validation before send

**2. Scheduled**
- Set specific date/time
- Timezone-aware
- Queued for execution

**3. Recurring**
- Daily, Weekly, Monthly options
- Automatic re-enrollment
- Frequency limits still apply

**4. Auto-Pilot**
- AI-driven optimal timing
- Learns from engagement patterns
- Automatically pauses low-engagement contacts

## 🔄 Workflows

### Workflow 1: Contact Sync
- **Trigger**: CRON (hourly)
- **Purpose**: Sync Google Sheets → Airtable
- **Duration**: ~2-5 minutes for 1000 contacts

### Workflow 2: Campaign Initialization
- **Trigger**: Webhook (manual/UI)
- **Purpose**: Create campaign, validate, queue
- **Duration**: ~10-30 seconds

### Workflow 3: Execute Campaign Queue
- **Trigger**: CRON (every 5 minutes)
- **Purpose**: Process queue, send to Lido
- **Duration**: ~1-2 minutes per batch (50 emails)

### Workflow 4: Track Email Opens
- **Trigger**: Webhook (from Lido)
- **Purpose**: Update metrics on open
- **Duration**: <1 second per event

### Workflow 5: Claude Email Generation
- **Trigger**: Called by Workflow 2
- **Purpose**: Generate personalized emails
- **Duration**: ~2-5 seconds per email

### Workflow 6: Auto-Pilot Campaign Generator
- **Trigger**: CRON (daily at 9am)
- **Purpose**: Auto-create campaigns for stale leads
- **Duration**: ~5-10 minutes

## 📡 API Documentation

### Create Campaign

```http
POST /webhook/create-campaign
Authorization: Bearer YOUR_SECRET_TOKEN
Content-Type: application/json

{
  "workspaceId": "workspace1",
  "brandId": "BRD-001",
  "contactIds": ["C-001", "C-002"],
  "messageMode": "claude",
  "deliveryMode": "sendNow",
  "campaignName": "Test Campaign"
}
```

**Response:**
```json
{
  "success": true,
  "campaignId": "CMP-20251022-ABC12",
  "validContacts": 2,
  "blockedContacts": 0,
  "status": "ready"
}
```

### Generate Email with Claude

```http
POST /webhook/generate-email
Authorization: Bearer YOUR_SECRET_TOKEN
Content-Type: application/json

{
  "contactId": "C-001",
  "brandId": "BRD-001",
  "context": {
    "notes": "Recent inquiry about O-1A"
  }
}
```

**Response:**
```json
{
  "subject": "John, let's talk about your O-1A opportunity",
  "body": "Hi John,\n\nI noticed it's been...",
  "generatedBy": "claude-sonnet-4",
  "timestamp": "2025-10-22T10:30:00Z"
}
```

### Track Email Open

```http
POST /webhook/email-opened
Authorization: Bearer YOUR_SECRET_TOKEN
Content-Type: application/json

{
  "queue_id": "Q-20251022-XYZ89",
  "contact_email": "john@example.com",
  "campaign_id": "CMP-20251022-ABC12",
  "opened_at": "2025-10-22T11:15:00Z"
}
```

## 🚢 Deployment

### Production Checklist

- [ ] All API keys configured
- [ ] Google Sheets created and populated
- [ ] Airtable base set up with all tables
- [ ] n8n workflows imported and activated
- [ ] Tracking server running with SSL
- [ ] Lido automations configured
- [ ] Webhooks tested
- [ ] Frequency validation verified
- [ ] Test campaigns sent successfully
- [ ] Monitoring enabled

### Deployment Scripts

```bash
# Deploy tracking server
./scripts/deploy-tracking-server.sh

# Deploy n8n workflows
./scripts/deploy-n8n-workflows.sh

# Setup monitoring
./scripts/setup-monitoring.sh
```

### SSL/HTTPS Setup

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-tracking-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring

### Health Checks

```bash
# Tracking server
curl https://your-tracking-domain.com/health

# n8n workflows
curl https://your-n8n-domain.com/healthz
```

### Logs

```bash
# Tracking server logs
pm2 logs email-tracking

# n8n logs
docker logs n8n
```

### Metrics to Monitor

- Campaign creation rate
- Email send success rate
- Open rate trends
- Click rate trends
- Frequency limit violations
- API errors
- System uptime

## 🐛 Troubleshooting

### Common Issues

**Issue: Campaigns not sending**
- Check n8n workflow execution logs
- Verify Lido automation is active
- Check frequency validation didn't block all contacts

**Issue: Claude API errors**
- Verify API key is correct
- Check rate limits not exceeded
- Ensure JSON parsing is working

**Issue: Tracking not working**
- Verify tracking server is running
- Check webhook URLs are correct
- Test pixel URL manually

**Issue: Sync failing**
- Check Google Sheets API quota
- Verify Airtable API limits
- Review n8n execution logs

### Debug Mode

```bash
# Enable debug logging in tracking server
NODE_ENV=development npm run dev

# n8n verbose logging
docker logs -f n8n
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/IGTA-Tech/multi-brand-email-automation-igta/issues)
- **Email**: support@igtatech.com

## 🎯 Roadmap

- [ ] Reply tracking and sentiment analysis
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] A/B testing for subject lines
- [ ] Predictive send time optimization
- [ ] Integration with CRM systems

---

**Built with ❤️ by IGTA**
