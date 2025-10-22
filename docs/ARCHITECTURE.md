# System Architecture Documentation

## Overview

The Multi-Brand Email Automation System uses a microservices architecture with clear separation of concerns across 5 distinct layers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Layer 1: Data Storage                      │
├──────────────────────────┬──────────────────────────────────────┤
│   Google Sheets          │         Airtable                      │
│   - Master source        │         - Relational DB               │
│   - 6 sheets            │         - 6 tables                    │
│   - API: 60 req/min     │         - API: 5 req/sec              │
└──────────────────────────┴──────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Layer 2: Workflow Automation (n8n)             │
├─────────────────────────────────────────────────────────────────┤
│  WF1: Contact Sync (hourly)                                      │
│  WF2: Campaign Init (webhook)                                    │
│  WF3: Execute Queue (every 5 min)                               │
│  WF4: Track Opens (webhook)                                      │
│  WF5: Claude Generation (called by WF2)                         │
│  WF6: Auto-Pilot (daily)                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                Layer 3: AI Intelligence (Claude API)             │
├─────────────────────────────────────────────────────────────────┤
│  - Email generation with brand voice                             │
│  - Context-aware personalization                                 │
│  - Tone adaptation based on lead score                          │
│  - Variable replacement and formatting                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Layer 4: Email Delivery (Lido)                  │
├─────────────────────────────────────────────────────────────────┤
│  - Gmail API integration                                         │
│  - Tracking pixel insertion                                      │
│  - Link wrapping for click tracking                             │
│  - Webhook callbacks on events                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               Layer 5: Validation & Tracking                     │
├─────────────────────────────────────────────────────────────────┤
│  - Frequency limit enforcement (24h/7d/30d)                     │
│  - Open/click tracking (Node.js server)                         │
│  - Real-time metrics updates                                     │
│  - Engagement scoring                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Campaign Creation

1. **User Action** → Submits campaign form via Google Sheets UI
2. **Apps Script** → Validates input, calls n8n webhook
3. **n8n WF2** → Receives request, loads data from Sheets
4. **Frequency Validation** → Checks send history, blocks over-limit contacts
5. **Message Generation** → If Claude mode, calls WF5 for AI generation
6. **Campaign Creation** → Writes to Airtable, queues in Sheets
7. **n8n WF3** → Picks up queue every 5 min, re-validates
8. **Lido Queue** → Writes ready emails to Lido Send Queue
9. **Lido Automation** → Sends via Gmail, inserts tracking
10. **Tracking Events** → Opens/clicks call n8n WF4
11. **Metrics Update** → All systems updated (Sheets, Airtable, analytics)

## Component Details

### Google Sheets (Master Database)

**Purpose**: Primary source of truth for contact data

**Sheets**:
- Ultimate Contact Sheet (46 columns)
- Send History Log (25 columns)
- Campaign Queue (20 columns)
- Brand Configuration (25 columns)
- Template Library (20 columns)
- Lido Send Queue (22 columns)

**Key Features**:
- Manual editing friendly
- Formula-based calculations
- Conditional formatting for visibility
- Apps Script integration

### Airtable (Relational Database)

**Purpose**: Campaign management and relational data

**Tables**:
- Contacts (linked to Campaigns, Send History)
- Brands (linked to Campaigns, Templates)
- Campaigns (linked to Queue, History)
- Campaign Queue (linked to Campaigns, Contacts)
- Templates (linked to Brands)
- Send History (linked to Contacts, Campaigns)

**Key Features**:
- 1:N relationships
- Native webhooks
- Advanced filtering
- API-first design

### n8n (Workflow Engine)

**Purpose**: Orchestrate all automation tasks

**6 Core Workflows**:

1. **Contact Sync** (CRON: hourly)
   - Read from Sheets
   - Filter updated contacts
   - Sync to Airtable
   - Update metrics

2. **Campaign Init** (Webhook: on-demand)
   - Receive campaign params
   - Load contacts & brand
   - Validate frequency
   - Generate messages (Claude)
   - Queue for sending

3. **Execute Queue** (CRON: every 5 min)
   - Query ready campaigns
   - Re-validate frequency
   - Write to Lido queue
   - Update status

4. **Track Opens** (Webhook: from Lido)
   - Receive open event
   - Update Send History
   - Recalculate engagement
   - Update campaign stats

5. **Claude Generation** (Called by WF2)
   - Load contact context
   - Build personalized prompt
   - Call Claude API
   - Parse JSON response
   - Return subject + body

6. **Auto-Pilot** (CRON: daily 9am)
   - Find stale hot leads
   - Check engagement
   - Auto-create campaigns
   - Queue for send

### Claude API (AI Engine)

**Purpose**: Generate personalized email content

**Model**: claude-sonnet-4-20250514

**Input**:
- Contact data (name, lead status, score, history)
- Brand voice guidelines
- Engagement metrics
- Previous interactions

**Output**:
- Personalized subject line
- Customized email body
- Tone-adapted to lead score

**Cost**: ~$0.0065 per email generated

### Lido (Email Delivery)

**Purpose**: Send emails via Gmail with tracking

**Features**:
- Gmail API integration (1B emails/day limit)
- Automatic tracking pixel insertion
- Link wrapping for click tracking
- Webhook callbacks on events
- Rate limiting and throttling

**Automations**:
1. Send email on new queue row
2. Track opens → call webhook
3. Track clicks → call webhook
4. Update status on completion

### Tracking Server (Node.js/Express)

**Purpose**: Handle open/click tracking events

**Endpoints**:
- `GET /track/pixel` - 1x1 GIF for opens
- `GET /track/click` - Redirect with tracking
- `POST /api/generate-pixel` - Create pixel URL
- `POST /api/wrap-links` - Add click tracking
- `GET /health` - Health check

**Technology**: Express.js, Node 18+

## Security Architecture

### Authentication

- **Google OAuth 2.0**: For Sheets/Gmail access
- **Airtable PAT**: Personal Access Token
- **Anthropic API Key**: For Claude access
- **Webhook Secret**: HMAC-style bearer token

### Data Protection

- API keys stored in environment variables
- Webhooks authenticated with bearer tokens
- SSL/TLS for all external communication
- No PII stored in logs

### Rate Limiting

- Google Sheets: 60 requests/min/user
- Airtable: 5 requests/second
- Claude API: Tier-based limits
- Gmail: 1 billion/day (effectively unlimited)

## Scalability

### Current Capacity

- **Contacts**: 100,000+
- **Brands**: Unlimited
- **Workspaces**: 5 (expandable)
- **Emails/day**: ~2,500 (500 per workspace)
- **Campaigns**: Unlimited concurrent

### Bottlenecks

1. **Google Sheets API**: 60 req/min limiting factor
   - Solution: Cache frequently accessed data
   - Solution: Batch requests

2. **Claude API**: Token limits and cost
   - Solution: Cache generated emails
   - Solution: Use templates for bulk sends

3. **Lido Processing**: Sequential email sending
   - Solution: Multiple Lido instances
   - Solution: Direct Gmail API integration

### Scaling Strategies

**Vertical Scaling**:
- Upgrade n8n to larger instance
- Add Redis for caching
- Optimize database queries

**Horizontal Scaling**:
- Multiple tracking servers (load balanced)
- Separate n8n instances per brand
- Database sharding by brand

## Monitoring & Observability

### Health Checks

- Tracking server: `/health` endpoint
- n8n: Workflow execution logs
- Lido: Automation status
- Google Sheets: Last sync timestamp

### Metrics

- Campaign creation rate
- Email send success rate
- Open/click rates
- Frequency violations
- API error rates
- System uptime

### Logging

- n8n: Execution logs (30 days retention)
- Tracking server: Request logs
- Google Sheets: System Logs tab
- Airtable: Audit log (Enterprise)

## Disaster Recovery

### Backup Strategy

- **Google Sheets**: Daily automated backup via Apps Script
- **Airtable**: Weekly export to CSV
- **n8n**: Workflow JSON exports (version controlled)
- **Code**: Git repository (GitHub)

### Recovery Procedures

1. **Data Loss**: Restore from daily Sheets backup
2. **Workflow Failure**: Re-import from Git
3. **Server Failure**: Redeploy from Docker
4. **Complete Disaster**: Full system rebuild from documentation

### RTO/RPO

- **Recovery Time Objective**: 4 hours
- **Recovery Point Objective**: 24 hours (daily backups)

## Future Architecture

### Planned Enhancements

1. **Dedicated Database**: PostgreSQL for better performance
2. **Message Queue**: RabbitMQ/Redis for async processing
3. **Analytics Dashboard**: Custom Grafana/Superset dashboard
4. **API Gateway**: Centralized API management
5. **Microservices**: Separate services for tracking, generation, delivery

### Migration Path

Phase 1: Add PostgreSQL alongside existing systems
Phase 2: Migrate Send History to PostgreSQL
Phase 3: Migrate all transactional data
Phase 4: Keep Sheets for configuration only
Phase 5: Build API gateway for external integrations

## Technology Choices Rationale

### Why Google Sheets?
- ✓ Easy manual editing
- ✓ No database setup required
- ✓ Built-in visualization
- ✓ Familiar interface for non-technical users
- ✗ Limited query performance
- ✗ API rate limits

### Why Airtable?
- ✓ Native relationships (1:N)
- ✓ Good API
- ✓ Built-in webhooks
- ✓ Nice UI for campaign management
- ✗ Cost at scale
- ✗ Limited customization

### Why n8n?
- ✓ Visual workflow builder
- ✓ Self-hosted option
- ✓ Great integrations
- ✓ Active community
- ✗ Learning curve
- ✗ Execution logs retention limits

### Why Claude?
- ✓ Best-in-class text generation
- ✓ Long context window
- ✓ Follows instructions well
- ✓ JSON output support
- ✗ Cost per token
- ✗ Rate limits

### Why Lido?
- ✓ Gmail integration
- ✓ Built-in tracking
- ✓ Easy setup
- ✗ Cost
- ✗ Limited customization
- Alternative: Direct Gmail API (more complex but free)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Maintained By**: IGTA Tech Team
