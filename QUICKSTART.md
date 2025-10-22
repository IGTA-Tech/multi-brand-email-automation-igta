# Quick Start Guide

Get up and running with the Multi-Brand Email Automation System in under 30 minutes.

## 🚀 Fastest Path to Production

### Step 1: Prerequisites (5 minutes)

Sign up for these services:
- [ ] Google Workspace account
- [ ] Airtable account (Team plan)
- [ ] n8n.cloud account (or prepare VPS)
- [ ] Lido account (Pro plan)
- [ ] Anthropic Claude API key

### Step 2: Clone & Configure (5 minutes)

```bash
# Clone repository
git clone https://github.com/IGTA-Tech/multi-brand-email-automation-igta.git
cd multi-brand-email-automation-igta

# Copy environment file
cp tracking-server/.env.example tracking-server/.env

# Edit with your values
nano tracking-server/.env
```

Required environment variables:
```env
N8N_BASE_URL=https://your-n8n-instance.app.n8n.cloud
WEBHOOK_SECRET=your-random-secure-string
```

### Step 3: Google Sheets Setup (10 minutes)

1. **Create new Google Sheet**: "Multi-Brand Email Automation Master"

2. **Create 6 sheets** with these exact names:
   - Ultimate Contact Sheet
   - Send History Log
   - Campaign Queue
   - Brand Configuration
   - Template Library
   - Lido Send Queue

3. **Install Apps Script**:
   - Extensions → Apps Script
   - Copy contents from `google-apps-script/Code.gs`
   - Create HTML file: `CampaignDialog.html`
   - Copy contents from `google-apps-script/CampaignDialog.html`
   - Save both files

4. **Run setup**:
   - In Apps Script editor, run `onOpen()` function
   - Authorize permissions
   - Run `setupTriggers()` function

5. **Test**:
   - Refresh Google Sheets
   - You should see "Email Automation" menu
   - Click it to verify installation

### Step 4: Deploy Tracking Server (3 minutes)

```bash
# Install dependencies
cd tracking-server
npm install

# Start server (development)
npm run dev

# OR start with PM2 (production)
npm install -g pm2
pm2 start src/server.js --name email-tracking
pm2 save

# Test it's working
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T...",
  "service": "email-tracking-server",
  "version": "1.0.0"
}
```

### Step 5: n8n Setup (5 minutes)

1. **Access n8n**:
   - Go to your n8n instance
   - Sign in

2. **Add Credentials**:
   - Settings → Credentials → Add Credential
   - **Google OAuth2**: For Sheets/Gmail access
   - **Airtable Personal Access Token**: From airtable.com/account
   - **Anthropic API**: Your Claude API key
   - **HTTP Header Auth**: For webhook security

3. **Import Workflows**:
   - Settings → Import from File
   - Import all 6 workflows from `n8n-workflows/` directory:
     - 01-contact-sync.json
     - 02-campaign-initialization.json
     - (and 4 more)

4. **Activate Workflows**:
   - Open each workflow
   - Click "Active" toggle in top right
   - Verify no errors

### Step 6: Airtable Setup (5 minutes)

1. **Create Base**:
   - Go to airtable.com
   - Create new base: "Email Campaign Manager"

2. **Create Tables**:
   - Contacts (copy structure from docs)
   - Brands
   - Campaigns
   - Campaign Queue
   - Templates
   - Send History

3. **Get Credentials**:
   - Copy Base ID from URL
   - Generate Personal Access Token
   - Add to n8n credentials

### Step 7: Lido Setup (Optional - for sending)

1. **Sign up**: lido.app/signup

2. **Connect Gmail**:
   - Settings → Integrations
   - Connect your Google Workspace account(s)

3. **Import Spreadsheet**:
   - Import your Google Sheet
   - Select "Lido Send Queue" tab

4. **Create Automation**:
   - New Automation
   - Trigger: On new row added
   - Action: Send email via Gmail
   - Map columns to email fields

### Step 8: Test Campaign (2 minutes)

1. **Add test contact** in Google Sheets:
   ```
   Contact ID: C-TEST-001
   First Name: Test
   Last Name: User
   Email: your-email@example.com
   Lead Status: Hot Lead
   Lead Score: 10
   ```

2. **Create test brand** in Brand Configuration:
   ```
   Brand ID: BRD-TEST
   Brand Name: Test Brand
   From Email: your-email@example.com
   ```

3. **Create campaign**:
   - In Google Sheets: Email Automation → Create Campaign
   - Select test brand
   - Select test contact
   - Choose "Manual" message mode
   - Write simple test message
   - Select "Send Now"
   - Click Create

4. **Verify**:
   - Check Campaign Queue sheet (should have entry)
   - Check n8n execution logs
   - Check Lido (if configured)
   - Check your email!

## ✅ Success Checklist

- [ ] Google Sheets created with all 6 tabs
- [ ] Apps Script installed and menu visible
- [ ] Tracking server running (health check passes)
- [ ] n8n workflows imported and active
- [ ] Airtable base created with all tables
- [ ] Test contact added
- [ ] Test brand configured
- [ ] Test campaign created successfully
- [ ] System logs show no errors

## 🆘 Quick Troubleshooting

**Problem**: "Email Automation" menu not showing
- **Solution**: Refresh page, run `onOpen()` function again

**Problem**: n8n workflow errors
- **Solution**: Check all credentials are added correctly

**Problem**: No emails sending
- **Solution**: Verify Lido automation is active

**Problem**: Tracking not working
- **Solution**: Check tracking server is running on correct port

## 📚 Next Steps

Once basic setup is working:

1. **Add more contacts**: Import CSV to Google Sheets
2. **Configure brands**: Add your actual brands
3. **Create templates**: Build reusable email templates
4. **Test Claude AI**: Try AI-generated emails
5. **Set up monitoring**: Configure alerts
6. **Go live**: Create your first real campaign!

## 🔗 Useful Links

- [Full Documentation](./README.md)
- [API Reference](./docs/API.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- [Video Tutorial](#) (coming soon)

## 💬 Get Help

- **Issues**: [GitHub Issues](https://github.com/IGTA-Tech/multi-brand-email-automation-igta/issues)
- **Email**: support@igtatech.com
- **Documentation**: See `/docs` folder

---

**Time to first campaign**: ~30 minutes
**Difficulty**: Intermediate
**Support**: Full documentation + community help
