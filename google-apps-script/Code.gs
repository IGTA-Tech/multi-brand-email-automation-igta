/**
 * MULTI-BRAND EMAIL AUTOMATION - IGTA VERSION
 * Google Apps Script
 *
 * This script provides helper functions and triggers for the
 * email automation system.
 */

// ===== CONFIGURATION =====

const CONFIG = {
  SHEET_NAME: 'Ultimate Contact Sheet',
  SEND_HISTORY_SHEET: 'Send History Log',
  CAMPAIGN_QUEUE_SHEET: 'Campaign Queue',
  BRAND_CONFIG_SHEET: 'Brand Configuration',
  TEMPLATE_LIBRARY_SHEET: 'Template Library',
  LIDO_SEND_QUEUE_SHEET: 'Lido Send Queue',

  // N8N webhook URLs (UPDATE THESE)
  N8N_BASE_URL: 'https://YOUR_N8N_DOMAIN',
  CREATE_CAMPAIGN_WEBHOOK: '/webhook/create-campaign',
  WEBHOOK_SECRET: 'YOUR_SECRET_TOKEN',

  // Frequency limits
  MAX_EMAILS_24H: 1,
  MAX_EMAILS_7D: 3,
  MAX_EMAILS_30D: 10
};

// ===== HELPER FUNCTIONS =====

/**
 * Get active spreadsheet
 */
function getActiveSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Get sheet by name
 */
function getSheet(sheetName) {
  const ss = getActiveSpreadsheet();
  return ss.getSheetByName(sheetName);
}

/**
 * Show toast notification
 */
function showToast(message, title = 'Email Automation', timeout = 5) {
  const ss = getActiveSpreadsheet();
  ss.toast(message, title, timeout);
}

/**
 * Log to sheet (for debugging)
 */
function logToSheet(message, level = 'INFO') {
  const ss = getActiveSpreadsheet();
  let logSheet = ss.getSheetByName('System Logs');

  if (!logSheet) {
    logSheet = ss.insertSheet('System Logs');
    logSheet.appendRow(['Timestamp', 'Level', 'Message']);
  }

  logSheet.appendRow([new Date(), level, message]);
}

// ===== MENU FUNCTIONS =====

/**
 * Create custom menu
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Email Automation')
    .addItem('Create Campaign...', 'showCampaignDialog')
    .addSeparator()
    .addItem('Sync to Airtable', 'syncToAirtable')
    .addItem('Refresh Frequency Counts', 'refreshFrequencyCounts')
    .addSeparator()
    .addItem('Test Claude Generation', 'testClaudeGeneration')
    .addItem('View System Logs', 'viewSystemLogs')
    .addSeparator()
    .addItem('Setup Triggers', 'setupTriggers')
    .addItem('About', 'showAboutDialog')
    .addToUi();
}

/**
 * Show campaign creation dialog
 */
function showCampaignDialog() {
  const html = HtmlService.createHtmlOutputFromFile('CampaignDialog')
    .setWidth(600)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Create New Campaign');
}

/**
 * Show about dialog
 */
function showAboutDialog() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Multi-Brand Email Automation System - IGTA Version',
    'Version 1.0\n\nThis system automates email campaigns across multiple brands and workspaces.\n\nComponents:\n- Google Sheets (Data Storage)\n- Airtable (Relational DB)\n- n8n (Automation)\n- Claude API (AI Generation)\n- Lido (Email Delivery)',
    ui.ButtonSet.OK
  );
}

// ===== DATA SYNC FUNCTIONS =====

/**
 * Sync to Airtable via n8n
 */
function syncToAirtable() {
  try {
    const url = CONFIG.N8N_BASE_URL + '/webhook/sync-to-airtable';
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.WEBHOOK_SECRET,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        trigger: 'manual',
        timestamp: new Date().toISOString()
      })
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    showToast('Sync completed: ' + result.message);
    logToSheet('Manual sync to Airtable completed');
  } catch (error) {
    showToast('Sync failed: ' + error.message, 'Error');
    logToSheet('Sync failed: ' + error.message, 'ERROR');
  }
}

/**
 * Refresh frequency counts for all contacts
 */
function refreshFrequencyCounts() {
  const contactSheet = getSheet(CONFIG.SHEET_NAME);
  const sendHistorySheet = getSheet(CONFIG.SEND_HISTORY_SHEET);

  if (!contactSheet || !sendHistorySheet) {
    showToast('Required sheets not found', 'Error');
    return;
  }

  const contactData = contactSheet.getDataRange().getValues();
  const sendHistory = sendHistorySheet.getDataRange().getValues();

  const now = new Date();
  const day24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Find column indices
  const emailCol = contactData[0].indexOf('Email');
  const count24hCol = contactData[0].indexOf('Last 24 Hours Email Count');
  const count7dCol = contactData[0].indexOf('Last 7 Days Email Count');
  const count30dCol = contactData[0].indexOf('Last 30 Days Email Count');

  const histEmailCol = sendHistory[0].indexOf('Contact Email');
  const histSentCol = sendHistory[0].indexOf('Actual Send Time');

  // Calculate counts
  for (let i = 1; i < contactData.length; i++) {
    const email = contactData[i][emailCol];
    if (!email) continue;

    let count24h = 0;
    let count7d = 0;
    let count30d = 0;

    for (let j = 1; j < sendHistory.length; j++) {
      if (sendHistory[j][histEmailCol] === email) {
        const sentDate = new Date(sendHistory[j][histSentCol]);

        if (sentDate >= day24Ago) count24h++;
        if (sentDate >= days7Ago) count7d++;
        if (sentDate >= days30Ago) count30d++;
      }
    }

    // Update sheet
    contactSheet.getRange(i + 1, count24hCol + 1).setValue(count24h);
    contactSheet.getRange(i + 1, count7dCol + 1).setValue(count7d);
    contactSheet.getRange(i + 1, count30dCol + 1).setValue(count30d);
  }

  showToast('Frequency counts refreshed for ' + (contactData.length - 1) + ' contacts');
  logToSheet('Frequency counts refreshed');
}

// ===== CAMPAIGN FUNCTIONS =====

/**
 * Create campaign from dialog
 */
function createCampaignFromDialog(formData) {
  try {
    // Validate form data
    if (!formData.workspaceId || !formData.brandId || !formData.contactIds) {
      throw new Error('Missing required fields');
    }

    // Call n8n webhook
    const url = CONFIG.N8N_BASE_URL + CONFIG.CREATE_CAMPAIGN_WEBHOOK;
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.WEBHOOK_SECRET,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(formData)
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.success) {
      showToast('Campaign created: ' + result.campaignId);
      logToSheet('Campaign created: ' + result.campaignId);
      return result;
    } else {
      throw new Error('Campaign creation failed: ' + result.message);
    }
  } catch (error) {
    showToast('Error creating campaign: ' + error.message, 'Error');
    logToSheet('Error creating campaign: ' + error.message, 'ERROR');
    throw error;
  }
}

/**
 * Get brands for dropdown
 */
function getBrands() {
  const brandSheet = getSheet(CONFIG.BRAND_CONFIG_SHEET);
  if (!brandSheet) return [];

  const data = brandSheet.getDataRange().getValues();
  const brands = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][2]) { // Active column
      brands.push({
        id: data[i][0],
        name: data[i][1],
        workspace: data[i][3]
      });
    }
  }

  return brands;
}

/**
 * Get contacts for selection
 */
function getContacts(filterLeadStatus = null) {
  const contactSheet = getSheet(CONFIG.SHEET_NAME);
  if (!contactSheet) return [];

  const data = contactSheet.getDataRange().getValues();
  const contacts = [];

  const idCol = data[0].indexOf('Contact ID');
  const firstNameCol = data[0].indexOf('First Name');
  const lastNameCol = data[0].indexOf('Last Name');
  const emailCol = data[0].indexOf('Email');
  const leadStatusCol = data[0].indexOf('Lead Status');
  const leadScoreCol = data[0].indexOf('Lead Score');

  for (let i = 1; i < data.length; i++) {
    const leadStatus = data[i][leadStatusCol];

    if (filterLeadStatus && leadStatus !== filterLeadStatus) {
      continue;
    }

    contacts.push({
      id: data[i][idCol],
      firstName: data[i][firstNameCol],
      lastName: data[i][lastNameCol],
      email: data[i][emailCol],
      leadStatus: leadStatus,
      leadScore: data[i][leadScoreCol]
    });
  }

  return contacts;
}

/**
 * Get templates for dropdown
 */
function getTemplates(brandId = null) {
  const templateSheet = getSheet(CONFIG.TEMPLATE_LIBRARY_SHEET);
  if (!templateSheet) return [];

  const data = templateSheet.getDataRange().getValues();
  const templates = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][14]) { // Active column
      if (!brandId || data[i][2] === brandId) {
        templates.push({
          id: data[i][0],
          name: data[i][1],
          brandId: data[i][2],
          category: data[i][3],
          subject: data[i][4]
        });
      }
    }
  }

  return templates;
}

// ===== FREQUENCY VALIDATION =====

/**
 * Check if contact can receive email (frequency validation)
 */
function canContactReceiveEmail(contactEmail) {
  const contactSheet = getSheet(CONFIG.SHEET_NAME);
  const sendHistorySheet = getSheet(CONFIG.SEND_HISTORY_SHEET);

  if (!contactSheet || !sendHistorySheet) {
    return { canSend: false, reason: 'Required sheets not found' };
  }

  // Find contact
  const contactData = contactSheet.getDataRange().getValues();
  const emailCol = contactData[0].indexOf('Email');
  const count24hCol = contactData[0].indexOf('Last 24 Hours Email Count');
  const count7dCol = contactData[0].indexOf('Last 7 Days Email Count');
  const count30dCol = contactData[0].indexOf('Last 30 Days Email Count');
  const optedOutCol = contactData[0].indexOf('Opted Out');

  let contactRow = null;
  for (let i = 1; i < contactData.length; i++) {
    if (contactData[i][emailCol] === contactEmail) {
      contactRow = contactData[i];
      break;
    }
  }

  if (!contactRow) {
    return { canSend: false, reason: 'Contact not found' };
  }

  // Check opt-out
  if (contactRow[optedOutCol]) {
    return { canSend: false, reason: 'Contact has opted out' };
  }

  // Check frequency limits
  const count24h = contactRow[count24hCol] || 0;
  const count7d = contactRow[count7dCol] || 0;
  const count30d = contactRow[count30dCol] || 0;

  if (count24h >= CONFIG.MAX_EMAILS_24H) {
    return { canSend: false, reason: '24-hour limit exceeded (' + count24h + '/' + CONFIG.MAX_EMAILS_24H + ')' };
  }

  if (count7d >= CONFIG.MAX_EMAILS_7D) {
    return { canSend: false, reason: '7-day limit exceeded (' + count7d + '/' + CONFIG.MAX_EMAILS_7D + ')' };
  }

  if (count30d >= CONFIG.MAX_EMAILS_30D) {
    return { canSend: false, reason: '30-day limit exceeded (' + count30d + '/' + CONFIG.MAX_EMAILS_30D + ')' };
  }

  return {
    canSend: true,
    counts: {
      last24h: count24h,
      last7d: count7d,
      last30d: count30d
    }
  };
}

// ===== CLAUDE INTEGRATION =====

/**
 * Test Claude email generation
 */
function testClaudeGeneration() {
  try {
    // Get first hot lead
    const contacts = getContacts('Hot Lead');
    if (contacts.length === 0) {
      showToast('No hot leads found', 'Error');
      return;
    }

    const testContact = contacts[0];
    const brands = getBrands();
    if (brands.length === 0) {
      showToast('No active brands found', 'Error');
      return;
    }

    const testBrand = brands[0];

    // Call Claude generation webhook
    const url = CONFIG.N8N_BASE_URL + '/webhook/generate-email';
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.WEBHOOK_SECRET,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        contactId: testContact.id,
        brandId: testBrand.id,
        context: {
          notes: 'Test generation'
        }
      })
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    // Show result in dialog
    const html = HtmlService.createHtmlOutput(
      '<h3>Claude Generated Email</h3>' +
      '<p><strong>Contact:</strong> ' + testContact.firstName + ' ' + testContact.lastName + '</p>' +
      '<p><strong>Brand:</strong> ' + testBrand.name + '</p>' +
      '<hr>' +
      '<p><strong>Subject:</strong> ' + result.subject + '</p>' +
      '<p><strong>Body:</strong></p>' +
      '<pre style="white-space: pre-wrap;">' + result.body + '</pre>' +
      '<hr>' +
      '<p><em>Generated by ' + result.generatedBy + ' at ' + result.timestamp + '</em></p>'
    )
    .setWidth(600)
    .setHeight(600);

    SpreadsheetApp.getUi().showModalDialog(html, 'Test Claude Generation');
    logToSheet('Test Claude generation successful');
  } catch (error) {
    showToast('Error testing Claude: ' + error.message, 'Error');
    logToSheet('Error testing Claude: ' + error.message, 'ERROR');
  }
}

// ===== TRIGGERS =====

/**
 * Setup time-based triggers
 */
function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Hourly frequency count refresh
  ScriptApp.newTrigger('refreshFrequencyCounts')
    .timeBased()
    .everyHours(1)
    .create();

  // Daily cleanup of old log entries (keep 30 days)
  ScriptApp.newTrigger('cleanupOldLogs')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();

  showToast('Triggers set up successfully');
  logToSheet('Triggers configured');
}

/**
 * Cleanup old log entries
 */
function cleanupOldLogs() {
  const ss = getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('System Logs');

  if (!logSheet) return;

  const data = logSheet.getDataRange().getValues();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  let deleteCount = 0;

  for (let i = data.length - 1; i >= 1; i--) {
    const logDate = new Date(data[i][0]);
    if (logDate < cutoffDate) {
      logSheet.deleteRow(i + 1);
      deleteCount++;
    }
  }

  if (deleteCount > 0) {
    logToSheet('Cleaned up ' + deleteCount + ' old log entries');
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format date for display
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Generate unique ID
 */
function generateId(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return prefix + '-' + timestamp + '-' + random;
}

/**
 * View system logs
 */
function viewSystemLogs() {
  const ss = getActiveSpreadsheet();
  let logSheet = ss.getSheetByName('System Logs');

  if (!logSheet) {
    showToast('No logs found', 'Info');
    return;
  }

  ss.setActiveSheet(logSheet);
  showToast('Viewing system logs');
}

// ===== AUTO-UPDATE FUNCTIONS =====

/**
 * On edit trigger - auto-update timestamps
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;

  // Only process certain sheets
  if (![CONFIG.SHEET_NAME, CONFIG.BRAND_CONFIG_SHEET, CONFIG.TEMPLATE_LIBRARY_SHEET].includes(sheet.getName())) {
    return;
  }

  // Update "Last Updated" column
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastUpdatedCol = headers.indexOf('Last Updated') + 1;
  const updatedByCol = headers.indexOf('Updated By') + 1;

  if (lastUpdatedCol > 0) {
    sheet.getRange(range.getRow(), lastUpdatedCol).setValue(new Date());
  }

  if (updatedByCol > 0) {
    sheet.getRange(range.getRow(), updatedByCol).setValue(Session.getActiveUser().getEmail());
  }
}

/**
 * On form submit (if using Google Forms)
 */
function onFormSubmit(e) {
  // Handle form submissions if you add Google Forms integration
  logToSheet('Form submitted', 'INFO');
}
