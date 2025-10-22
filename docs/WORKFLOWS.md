# n8n Workflows Documentation

Complete guide to all 6 n8n workflows in the Multi-Brand Email Automation System.

## Overview

The system uses 6 interconnected n8n workflows to automate the entire email campaign lifecycle:

1. **Contact Sync** - Bidirectional data synchronization
2. **Campaign Initialization** - Campaign creation and validation
3. **Execute Campaign Queue** - Email sending orchestration
4. **Track Email Opens** - Open event processing
5. **Claude Email Generation** - AI-powered email creation
6. **Auto-Pilot Campaign Generator** - Intelligent autonomous campaigns

---

## Workflow 01: Contact Sync

**File**: `n8n-workflows/01-contact-sync.json`

**Trigger**: Schedule (CRON: `0 * * * *` - Every hour)

**Purpose**: Synchronize contact data between Google Sheets (master) and Airtable (relational database)

### Flow

```
Schedule Trigger
  ↓
Read Contact Sheet (Google Sheets)
  ↓
Filter Last Hour Updates
  ↓
Split In Batches (25 contacts)
  ↓
Check Contact Exists in Airtable
  ↓
[If Exists] → Update Contact in Airtable
[If Not] → Create Contact in Airtable
```

### Key Features

- **Hourly sync** ensures data consistency
- **Incremental updates** only (filters by last modified time)
- **Batch processing** (25 contacts at a time) for efficiency
- **Upsert logic** (update if exists, create if not)
- **Error handling** with retry logic

### Configuration Required

- Google Sheets OAuth2 credential
- Airtable Personal Access Token
- Sheet Document ID
- Airtable Base ID

### Data Synchronized

- Contact ID
- First Name, Last Name
- Email
- Company, Industry
- Lead Status, Lead Score
- Phone, Location
- Brand Association
- Tags, Notes
- Last Modified timestamp

---

## Workflow 02: Campaign Initialization

**File**: `n8n-workflows/02-campaign-initialization.json`

**Trigger**: Webhook (POST `/webhook/create-campaign`)

**Purpose**: Create new campaigns with frequency validation and queue generation

### Flow

```
Webhook Trigger (from Apps Script)
  ↓
Extract Parameters
  ↓
Load Brand Config & Contacts
  ↓
Load Send History Log
  ↓
Validate Frequency Limits (24h/7d/30d)
  ↓
[If Claude Mode] → Call WF5 for email generation
  ↓
Create Campaign in Airtable
  ↓
Generate Queue Entries
  ↓
Write to Campaign Queue (Sheets)
  ↓
Return Success Response
```

### Key Features

- **Frequency validation** blocks over-limit contacts
- **Claude AI integration** for personalized emails
- **Template support** with variable replacement
- **Multiple delivery modes** (Send Now, Scheduled, Recurring, Auto-Pilot)
- **Atomic operations** (all or nothing)

### Input Parameters

```json
{
  "campaign_name": "Q4 Outreach",
  "brand_id": "BRD-001",
  "contact_ids": ["C-001", "C-002"],
  "message_mode": "claude|template|manual",
  "delivery_mode": "send_now|scheduled|recurring|auto_pilot",
  "subject": "Optional subject",
  "body": "Optional body",
  "template_id": "Optional template ID",
  "scheduled_time": "ISO 8601 timestamp",
  "recurring_pattern": "daily|weekly|monthly"
}
```

### Response

```json
{
  "success": true,
  "campaign_id": "CMP-12345",
  "contacts_queued": 15,
  "contacts_blocked": 2,
  "blocked_reasons": {
    "C-003": "Frequency limit: 1/1 in last 24h"
  }
}
```

---

## Workflow 03: Execute Campaign Queue

**File**: `n8n-workflows/03-execute-queue.json`

**Trigger**: Schedule (CRON: `*/5 * * * *` - Every 5 minutes)

**Purpose**: Process ready campaigns and move them to Lido Send Queue

### Flow

```
Schedule Trigger (Every 5 min)
  ↓
Read Campaign Queue
  ↓
Filter Ready to Send (status=ready, time<=now)
  ↓
Split In Batches (10 emails)
  ↓
Load Send History (for re-validation)
  ↓
Re-Validate Frequency Limits
  ↓
[If Passed] → Prepare with tracking pixel
            → Write to Lido Send Queue
            → Update status: processing
[If Blocked] → Update status: blocked
             → Log reason
```

### Key Features

- **Double frequency check** (campaign creation + queue execution)
- **Tracking pixel insertion** automatically
- **Link wrapping** for click tracking
- **Batch processing** prevents overload
- **Status updates** in real-time

### Frequency Validation

```javascript
const limits = {
  MAX_24H: 1,  // Max 1 email per 24 hours
  MAX_7D: 3,   // Max 3 emails per 7 days
  MAX_30D: 10  // Max 10 emails per 30 days
};
```

### Tracking Pixel Format

```
https://YOUR_TRACKING_DOMAIN/track/pixel?q=QUEUE_ID&c=CAMPAIGN_ID&e=BASE64_EMAIL
```

---

## Workflow 04: Track Email Opens

**File**: `n8n-workflows/04-track-opens.json`

**Trigger**: Webhook (POST `/webhook/email-opened`)

**Purpose**: Process email open events and update analytics

### Flow

```
Webhook Trigger (from Tracking Server)
  ↓
Extract Open Event Data
  ↓
Load Send History
  ↓
Find Matching Send Record
  ↓
Calculate Updated Metrics
  ├─ Increment open count
  ├─ Set first/last open timestamps
  └─ Recalculate engagement score
  ↓
Update Send History (Sheets & Airtable)
  ↓
[If First Open] → Update Contact Engagement Stats
  ↓
Return Success Response
```

### Key Features

- **First open detection** for accurate metrics
- **Engagement scoring** formula
- **Contact-level aggregation**
- **Dual database updates** (Sheets + Airtable)
- **Real-time processing**

### Engagement Score Formula

```javascript
// Per-email engagement
engagementScore = (opens × 10) + (clicks × 20) + (replies × 30)

// Contact-level engagement
contactEngagement = (totalOpens × 5) + (totalClicks × 10)
```

### Webhook Payload

```json
{
  "queue_id": "Q-12345",
  "contact_email": "john@example.com",
  "campaign_id": "CMP-12345",
  "opened_at": "2025-10-22T10:30:00Z"
}
```

---

## Workflow 05: Claude Email Generation

**File**: `n8n-workflows/05-claude-generation.json`

**Trigger**: Webhook (POST `/webhook/generate-email`)

**Purpose**: Generate personalized emails using Claude AI

### Flow

```
Webhook Trigger
  ↓
Extract Parameters (contact, brand, goal)
  ↓
Build Claude Prompt
  ├─ Add brand voice guidelines
  ├─ Add contact context
  ├─ Adjust tone based on lead score
  └─ Add campaign goal
  ↓
Call Claude API (Sonnet 4)
  ↓
Parse Claude Response (JSON)
  ↓
[If Success] → Log generation
             → Return subject + body
[If Failed] → Return error
```

### Key Features

- **Brand voice adaptation**
- **Lead score-based tone adjustment**
- **Context-aware personalization**
- **JSON output enforcement**
- **Fallback parsing** if JSON fails

### Tone Adjustment Logic

```javascript
if (leadScore >= 8) {
  tone = "HOT lead - enthusiastic, action-oriented, create urgency"
} else if (leadScore >= 5) {
  tone = "WARM lead - engaging, informative, build interest"
} else {
  tone = "COLD lead - gentle, educational, build trust"
}
```

### Claude Prompt Structure

```
You are an expert email copywriter for [BRAND_NAME].

BRAND VOICE: [voice guidelines]
BRAND TONE: [tone]

CONTACT INFORMATION:
- Name: [first_name]
- Lead Status: [status]
- Lead Score: [score]/10
- Company: [company]
- Industry: [industry]
- Notes: [notes]

TONE ADJUSTMENT: [based on lead score]
CAMPAIGN GOAL: [goal]

YOUR TASK:
Generate a personalized email with:
1. Subject line (max 60 chars)
2. Email body (150-300 words)
3. Clear call-to-action
4. Professional sign-off

RETURN FORMAT (JSON only):
{
  "subject": "Your subject line",
  "body": "Your email body with <br><br> for line breaks"
}
```

### Input Parameters

```json
{
  "contact": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "lead_status": "Hot Lead",
    "lead_score": 9,
    "company": "Acme Inc",
    "industry": "Technology",
    "notes": "Interested in enterprise plan",
    "recent_activity": "Downloaded whitepaper"
  },
  "brand": {
    "brand_id": "BRD-001",
    "brand_name": "TechCorp",
    "voice_guidelines": "Professional yet approachable, technical but not jargon-heavy",
    "tone": "conversational"
  },
  "campaign_goal": "Follow up on whitepaper download",
  "additional_context": "They showed interest in security features"
}
```

### Response

```json
{
  "success": true,
  "subject": "Your enterprise security questions answered, John",
  "body": "Hi John,<br><br>I noticed you downloaded our enterprise security whitepaper...",
  "metadata": {
    "generatedAt": "2025-10-22T10:30:00Z",
    "model": "claude-sonnet-4-20250514",
    "firstName": "John",
    "brandName": "TechCorp",
    "leadScore": 9
  }
}
```

### Cost Estimation

- **Model**: claude-sonnet-4-20250514
- **Average tokens per generation**: ~500 input, ~200 output
- **Cost per email**: ~$0.0065
- **Monthly cost** (1,000 emails): ~$6.50

---

## Workflow 06: Auto-Pilot Campaign Generator

**File**: `n8n-workflows/06-auto-pilot.json`

**Trigger**: Schedule (CRON: `0 9 * * *` - Daily at 9am)

**Purpose**: Automatically identify and engage stale hot leads

### Flow

```
Schedule Trigger (Daily 9am)
  ↓
Load All Contacts
  ↓
Load Send History
  ↓
Find Stale Hot Leads
  ├─ Never contacted (score >= 6)
  ├─ No contact in 7+ days (score >= 6)
  └─ Sort by lead score (highest first)
  ↓
Filter High-Value Leads (score >= 6)
  ↓
Match Contact to Brand
  ↓
Determine Campaign Strategy
  ├─ Never contacted → initial outreach
  ├─ Clicked last time → follow-up
  ├─ Opened only → re-engagement
  └─ No engagement → different angle
  ↓
Call Claude Generation (WF5)
  ↓
[If Success] → Create Campaign
             → Write to Queue
             → Schedule for immediate send
[If Failed] → Log error
  ↓
Generate Daily Summary
```

### Key Features

- **Intelligent lead identification**
- **Engagement-based strategy**
- **Automatic campaign creation**
- **Top 20 leads daily** (configurable)
- **Self-optimizing** based on history

### Lead Identification Logic

```javascript
// Criteria for stale leads:
- Lead score >= 6 (warm or hot)
- Lead status != Customer or Unsubscribed
- Last contact >= 7 days ago OR never contacted

// Prioritization:
- Sort by lead score (highest first)
- Limit to top 20 per day
```

### Campaign Strategy Decision Tree

```
IF never_contacted:
  Goal: "initial outreach and introduction"
  Context: "First contact - build rapport"

ELSE IF stale_lead:
  IF last_engagement == "clicked":
    Goal: "follow-up with previously engaged lead"
    Context: "They showed interest - move forward"

  ELSE IF last_engagement == "opened":
    Goal: "re-engagement with warm lead"
    Context: "They opened but didn't click - provide more value"

  ELSE:
    Goal: "re-engagement with cold lead"
    Context: "No engagement - try different angle"
```

### Daily Summary Output

```json
{
  "timestamp": "2025-10-22T09:15:00Z",
  "totalProcessed": 20,
  "successCount": 18,
  "failCount": 2,
  "status": "completed"
}
```

---

## Workflow Dependencies

```
┌─────────────────────────────────────────────────┐
│  WF1: Contact Sync (Hourly)                    │
│  Keeps Sheets ↔ Airtable in sync               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  WF2: Campaign Init (On-demand webhook)         │
│  Creates campaigns, calls WF5 if needed         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  WF3: Execute Queue (Every 5 min)               │
│  Moves ready campaigns to Lido                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  WF4: Track Opens (Event webhook)               │
│  Processes open events from tracking server     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  WF5: Claude Generation (Called by WF2, WF6)    │
│  Generates AI emails                            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  WF6: Auto-Pilot (Daily 9am)                    │
│  Autonomous campaign creation for stale leads   │
│  Calls WF5 for generation                       │
└─────────────────────────────────────────────────┘
```

---

## Installation Instructions

### 1. Import All Workflows

```bash
# In n8n UI:
# Settings → Import from File
# Import each JSON file from n8n-workflows/
```

### 2. Configure Credentials

#### Google Sheets OAuth2
- Settings → Credentials → Add Credential
- Type: Google OAuth2
- Scopes: `https://www.googleapis.com/auth/spreadsheets`

#### Airtable Personal Access Token
- Go to airtable.com/account
- Create Personal Access Token
- Scopes: `data.records:read`, `data.records:write`
- Add to n8n: Settings → Credentials → Airtable PAT

#### Anthropic API
- Get API key from console.anthropic.com
- Add to n8n: Settings → Credentials → Anthropic API

#### HTTP Header Auth (Webhooks)
- Create random secure string: `openssl rand -hex 32`
- Add to n8n: Settings → Credentials → HTTP Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer YOUR_SECRET_HERE`

### 3. Update Configuration Values

In each workflow, replace placeholders:

- `YOUR_N8N_DOMAIN` → Your n8n instance URL
- `YOUR_AIRTABLE_BASE_ID` → Your Airtable base ID
- `YOUR_TRACKING_DOMAIN` → Your tracking server domain
- Document IDs for Google Sheets

### 4. Activate Workflows

- Open each workflow
- Click "Active" toggle in top right
- Verify no errors in execution log

---

## Monitoring & Debugging

### Check Workflow Executions

```
n8n UI → Executions tab
- View all recent executions
- Filter by workflow
- Check success/failure status
- View detailed logs
```

### Common Issues

**Issue**: Workflow fails with "Credentials not found"
- **Solution**: Re-authenticate credentials

**Issue**: "Sheet not found" error
- **Solution**: Verify sheet name spelling (case-sensitive)

**Issue**: Claude generation timeout
- **Solution**: Increase execution timeout in Settings

**Issue**: Frequency validation too strict
- **Solution**: Adjust limits in WF2 and WF3 function nodes

### Enable Debug Logging

Add to function nodes:

```javascript
console.log('Debug:', JSON.stringify(data));
```

View logs in execution details.

---

## Performance Optimization

### Reduce API Calls

- Cache frequently accessed data
- Batch operations where possible
- Use incremental sync (WF1)

### Improve Execution Speed

- Reduce batch sizes if timeouts occur
- Split large workflows into smaller ones
- Use parallel processing where possible

### Cost Optimization

- Adjust Claude generation frequency
- Cache generated emails for similar contacts
- Use templates for bulk sends instead of AI

---

## Workflow Limits

| Workflow | Max Execution Time | Max Items Processed | Rate Limit |
|----------|-------------------|---------------------|------------|
| WF1      | 10 minutes        | 1,000 contacts      | 60 req/min |
| WF2      | 5 minutes         | 100 contacts        | As needed  |
| WF3      | 10 minutes        | 100 emails          | Every 5min |
| WF4      | 30 seconds        | 1 event             | Unlimited  |
| WF5      | 30 seconds        | 1 email             | Claude API |
| WF6      | 15 minutes        | 20 leads            | Once/day   |

---

## Security Best Practices

1. **Webhook Authentication**: Always use bearer tokens
2. **API Key Storage**: Use n8n credentials, never hardcode
3. **Data Validation**: Validate all webhook inputs
4. **Rate Limiting**: Implement on webhook endpoints
5. **Audit Logging**: Log all campaign creations
6. **Access Control**: Restrict workflow editing permissions

---

## Testing Workflows

### Test Individual Workflows

1. **WF1 (Contact Sync)**:
   - Add test contact in Sheets
   - Trigger manually
   - Verify appears in Airtable

2. **WF2 (Campaign Init)**:
   - Use Postman/curl to call webhook
   - Provide valid test data
   - Check Campaign Queue in Sheets

3. **WF3 (Execute Queue)**:
   - Add ready entry to Campaign Queue
   - Wait for next 5-min execution
   - Check Lido Send Queue

4. **WF4 (Track Opens)**:
   - Simulate webhook call
   - Verify Send History updates

5. **WF5 (Claude Generation)**:
   - Call with test contact data
   - Verify subject + body returned

6. **WF6 (Auto-Pilot)**:
   - Trigger manually
   - Check logs for identified leads
   - Verify campaigns created

---

## Troubleshooting Guide

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions to common issues.

---

## Version History

- **v1.0** (2025-10-22): Initial release
  - All 6 workflows implemented
  - Complete documentation
  - Production-ready

---

**Maintained By**: IGTA Tech Team
**Last Updated**: 2025-10-22
**Support**: support@igtatech.com
