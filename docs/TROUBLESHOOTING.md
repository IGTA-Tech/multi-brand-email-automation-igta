# Troubleshooting Guide

Common issues and solutions for the Multi-Brand Email Automation System.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Campaign Issues](#campaign-issues)
- [Email Delivery Issues](#email-delivery-issues)
- [Tracking Issues](#tracking-issues)
- [n8n Workflow Issues](#n8n-workflow-issues)
- [Performance Issues](#performance-issues)
- [Data Sync Issues](#data-sync-issues)

---

## Setup Issues

### Issue: "Email Automation" menu not appearing in Google Sheets

**Symptoms**:
- Menu bar doesn't show custom menu after installing Apps Script

**Causes**:
- Script not saved properly
- Permissions not granted
- Script not running

**Solutions**:
1. Refresh the Google Sheets page (hard refresh: Ctrl+Shift+R)
2. Run the `onOpen()` function manually:
   - Extensions → Apps Script
   - Select `onOpen` function
   - Click Run button
   - Grant permissions if prompted
3. Check execution log for errors:
   - View → Executions
   - Look for error messages
4. Verify script is saved and deployed

### Issue: Tracking server won't start

**Symptoms**:
- `npm start` fails
- Port already in use error

**Solutions**:
1. Check if port 3000 is already in use:
   ```bash
   lsof -i :3000
   # or
   netstat -ano | grep 3000
   ```

2. Kill existing process:
   ```bash
   kill -9 <PID>
   ```

3. Use different port:
   ```bash
   PORT=3001 npm start
   ```

4. Check environment variables:
   ```bash
   cat tracking-server/.env
   ```

5. Verify dependencies installed:
   ```bash
   cd tracking-server
   npm install
   ```

### Issue: n8n workflows won't import

**Symptoms**:
- Import fails with error
- Workflows missing nodes

**Solutions**:
1. Update n8n to latest version:
   ```bash
   docker pull n8nio/n8n:latest
   ```

2. Check JSON syntax:
   ```bash
   jq . n8n-workflows/01-contact-sync.json
   ```

3. Import one at a time instead of batch

4. Manually recreate workflows using UI

5. Verify all required nodes are available in your n8n instance

---

## Campaign Issues

### Issue: Campaign created but no emails sending

**Symptoms**:
- Campaign shows "ready" status
- No entries in Lido Send Queue
- Contacts not receiving emails

**Diagnosis Steps**:
1. Check Campaign Queue in Google Sheets
   - Are there queue entries?
   - What's the status of each entry?

2. Check n8n Workflow 3 (Execute Queue)
   - Is it active?
   - Check execution logs
   - Any errors?

3. Check frequency validation
   - Are contacts blocked by frequency limits?
   - Look for warnings in Campaign Queue

**Solutions**:

**Solution 1: Workflow not running**
```bash
# In n8n UI:
# 1. Open Workflow 3: Execute Campaign Queue
# 2. Toggle "Active" switch ON
# 3. Click "Execute Workflow" to test manually
```

**Solution 2: All contacts blocked by frequency**
- Review Send History Log
- Check Last 24h/7d counts for each contact
- Wait for frequency window to pass
- Or adjust limits in code (not recommended)

**Solution 3: Lido automation inactive**
- Open Lido
- Check automations are ON
- Test by manually adding row to Lido Send Queue

**Solution 4: Gmail API quota exceeded**
- Check Google Cloud Console quotas
- Wait for daily reset
- Add additional workspace accounts

### Issue: Claude generation failing

**Symptoms**:
- Campaign creation fails when using Claude mode
- Error: "Could not parse Claude response"

**Solutions**:

**Solution 1: API key invalid**
```bash
# Verify API key in n8n:
# Settings → Credentials → Anthropic API
# Test with simple request
```

**Solution 2: Rate limit exceeded**
- Check Anthropic dashboard for usage
- Wait for rate limit reset
- Upgrade API tier

**Solution 3: JSON parsing error**
- Check n8n WF5 logs
- Claude may be returning non-JSON
- Update system prompt to emphasize JSON output

**Solution 4: Timeout**
- Increase n8n execution timeout
- Settings → Workflow Settings → Execution Timeout

### Issue: Frequency validation too strict/lenient

**Symptoms**:
- Too many contacts being blocked
- OR contacts receiving too many emails

**Solutions**:

**Adjust limits in code**:
Edit `google-apps-script/Code.gs`:
```javascript
const CONFIG = {
  MAX_EMAILS_24H: 1,  // Change this
  MAX_EMAILS_7D: 3,   // Change this
  MAX_EMAILS_30D: 10  // Change this
};
```

**Add brand-specific overrides**:
In frequency validation function, add:
```javascript
if (brandId === 'BRD-VIP') {
  limits.DAYS_7 = 5;  // Higher limit for VIP brand
}
```

---

## Email Delivery Issues

### Issue: Emails going to spam

**Symptoms**:
- Low open rates (<10%)
- Contacts reporting emails in spam
- Gmail warnings

**Solutions**:

**Solution 1: Authenticate domain**
```
1. Set up SPF record
2. Set up DKIM signing
3. Set up DMARC policy
4. Verify in Google Workspace admin
```

**Solution 2: Warm up sending**
- Start with 50 emails/day
- Gradually increase over 2 weeks
- Maintain good engagement

**Solution 3: Improve content**
- Avoid spam trigger words
- Don't use all caps
- Include unsubscribe link
- Maintain text/HTML balance

**Solution 4: Clean list**
- Remove bounced addresses
- Honor opt-outs immediately
- Segment engaged vs non-engaged

### Issue: Bounced emails

**Symptoms**:
- Emails bouncing back
- "Address not found" errors

**Solutions**:

**Solution 1: Verify email addresses**
```javascript
// Add to validation:
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

**Solution 2: Check for typos**
- Common: gmail.con instead of gmail.com
- Review recent additions to contact list

**Solution 3: Remove hard bounces**
- Track bounces in Send History
- Mark contacts as "Bounced"
- Exclude from future campaigns

---

## Tracking Issues

### Issue: Opens not being tracked

**Symptoms**:
- Emails sent but no opens recorded
- Open rate = 0% for all campaigns

**Diagnosis**:
1. Check tracking server is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check Lido webhook configuration
   - Is webhook URL correct?
   - Is authorization header set?

3. Test tracking pixel manually:
   - Get pixel URL from an email
   - Open in browser
   - Should load 1x1 transparent GIF
   - Check n8n logs for webhook call

**Solutions**:

**Solution 1: Tracking server down**
```bash
# Restart server
cd tracking-server
pm2 restart email-tracking

# Or start if not running
pm2 start src/server.js --name email-tracking
```

**Solution 2: Webhook URL wrong**
- Update in Lido:
  - Should be: `https://your-domain.com/track/pixel`
  - NOT: `http://localhost:3000/track/pixel`

**Solution 3: Firewall blocking**
- Check server firewall allows port 3000
- Check n8n can reach tracking server
- Verify SSL certificate valid

**Solution 4: Email client blocking images**
- Many clients block images by default
- Opens only tracked when images loaded
- This is normal - expect 50-70% actual open rate

### Issue: Clicks not being tracked

**Symptoms**:
- Opens tracked but clicks = 0
- Links work but don't track

**Solutions**:

**Solution 1: Links not wrapped**
- Verify link wrapping is happening
- Check Lido configuration
- Test with sample email

**Solution 2: Wrong redirect URL**
- Check tracking URL format
- Should be: `/track/click?q=...&c=...&u=BASE64`

**Solution 3: Tracking server not redirecting**
- Check server logs
- Verify URL decoding works
- Test endpoint manually

---

## n8n Workflow Issues

### Issue: Workflow execution failing

**Symptoms**:
- Red "X" on workflow execution
- Error messages in execution log

**Diagnosis**:
1. Open workflow
2. Click "Executions" tab
3. Find failed execution
4. Click to see details
5. Check which node failed

**Common Node Failures**:

**Google Sheets node fails**:
- Credentials expired → Re-authenticate
- Sheet not found → Check sheet name spelling
- Range invalid → Verify range format (A:Z)

**Airtable node fails**:
- API key invalid → Regenerate token
- Table not found → Check table ID
- Field mapping wrong → Verify field names

**HTTP Request fails**:
- Timeout → Increase timeout setting
- 401 Unauthorized → Check auth header
- 404 Not Found → Verify URL

**Function node fails**:
- Syntax error → Check JavaScript syntax
- Variable undefined → Add null checks
- JSON parse error → Validate JSON

### Issue: Workflow stuck "Executing"

**Symptoms**:
- Execution shows as running for hours
- Never completes or fails

**Solutions**:

**Solution 1: Stop execution**
```bash
# In n8n UI:
# Executions → Click running execution → Stop
```

**Solution 2: Increase timeout**
```bash
# Settings → Workflow Settings
# Set Execution Timeout: 600 seconds
```

**Solution 3: Fix infinite loop**
- Check "Loop Over Items" nodes
- Verify exit condition
- Add iteration limit

**Solution 4: Restart n8n**
```bash
docker restart n8n
# or
pm2 restart n8n
```

---

## Performance Issues

### Issue: Slow campaign creation

**Symptoms**:
- Campaign creation takes > 1 minute
- UI freezes while creating

**Solutions**:

**Solution 1: Reduce contact count**
- Break large campaigns into batches
- Max 500 contacts per campaign recommended

**Solution 2: Optimize frequency validation**
- Add indexes to Send History
- Cache frequently accessed data
- Use Airtable filters instead of loading all

**Solution 3: Parallel processing**
- Process contacts in batches
- Use n8n's "Split In Batches" with smaller batch size

### Issue: High API usage / hitting rate limits

**Symptoms**:
- "Rate limit exceeded" errors
- 429 HTTP responses
- Slow data sync

**Solutions**:

**Google Sheets rate limits**:
```javascript
// Add delay between requests
Utilities.sleep(1000); // 1 second delay
```

**Airtable rate limits**:
```javascript
// Batch requests
// Stay under 5 requests/second
await sleep(200); // 200ms between requests
```

**Claude API rate limits**:
- Upgrade API tier
- Cache generated emails
- Use templates for bulk sends

---

## Data Sync Issues

### Issue: Google Sheets and Airtable out of sync

**Symptoms**:
- Contact in Sheets but not in Airtable
- Different values in both systems

**Diagnosis**:
1. Check last sync time in System Logs
2. Check n8n WF1 (Contact Sync) executions
3. Compare timestamps in both systems

**Solutions**:

**Solution 1: Manual sync**
```bash
# In Google Sheets:
# Email Automation → Sync to Airtable
```

**Solution 2: Increase sync frequency**
```bash
# In n8n WF1:
# Change CRON from "0 * * * *" (hourly)
# to "*/30 * * * *" (every 30 minutes)
```

**Solution 3: Full resync**
```javascript
// Temporarily disable "Filter Last Hour Updates" node
// This will sync ALL contacts
// Re-enable after one execution
```

---

## Debug Mode

### Enable verbose logging

**Tracking Server**:
```bash
NODE_ENV=development npm run dev
```

**n8n**:
```bash
N8N_LOG_LEVEL=debug docker logs -f n8n
```

**Google Apps Script**:
```javascript
// Add to functions:
Logger.log('Debug info: ' + JSON.stringify(data));

// View logs:
// Apps Script Editor → View → Executions
```

---

## Getting Help

### Before asking for help:

1. ✓ Check this troubleshooting guide
2. ✓ Check execution logs
3. ✓ Test individual components
4. ✓ Try restarting affected service
5. ✓ Check system health endpoints

### When asking for help, provide:

- Exact error message (copy-paste)
- Steps to reproduce
- Screenshots of errors
- Relevant log excerpts
- System configuration (sanitized)
- What you've already tried

### Support Channels:

- **GitHub Issues**: [Report bug](https://github.com/IGTA-Tech/multi-brand-email-automation-igta/issues)
- **Email**: support@igtatech.com
- **Documentation**: See `/docs` folder

---

## Emergency Procedures

### System completely down:

1. **Stop all services**:
   ```bash
   docker-compose down
   pm2 stop all
   ```

2. **Check system resources**:
   ```bash
   df -h  # Disk space
   free -m  # Memory
   top  # CPU usage
   ```

3. **Restart fresh**:
   ```bash
   docker-compose up -d
   pm2 restart all
   ```

4. **Verify health**:
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:5678/healthz
   ```

### Data corruption:

1. **Stop all writes**:
   - Deactivate all n8n workflows
   - Stop tracking server

2. **Restore from backup**:
   - Google Sheets: Restore from daily backup
   - Airtable: Import from CSV export

3. **Verify integrity**:
   - Check record counts match
   - Spot check sample records
   - Compare totals

4. **Resume operations**:
   - Reactivate workflows
   - Restart services
   - Monitor logs

---

**Last Updated**: 2025-10-22
**Maintained By**: IGTA Tech Team
