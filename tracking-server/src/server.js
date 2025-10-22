const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 1x1 transparent GIF for tracking pixel
const pixel = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// Configuration
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://your-n8n-domain.com';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-token';

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'email-tracking-server',
    version: '1.0.0'
  });
});

/**
 * Email open tracking pixel endpoint
 * GET /track/pixel?q=QUEUE_ID&c=CAMPAIGN_ID&e=BASE64_EMAIL&t=TIMESTAMP
 */
app.get('/track/pixel', async (req, res) => {
  const { q: queueId, c: campaignId, e: encodedEmail, t: timestamp } = req.query;

  try {
    // Decode email
    const email = Buffer.from(encodedEmail, 'base64').toString('utf-8');

    // Log open event
    console.log('Open event:', {
      queueId,
      campaignId,
      email,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    // Call n8n webhook (non-blocking)
    fetch(`${N8N_BASE_URL}/webhook/email-opened`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WEBHOOK_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        queue_id: queueId,
        contact_email: email,
        campaign_id: campaignId,
        opened_at: new Date().toISOString(),
        user_agent: req.headers['user-agent'],
        ip_address: req.ip
      })
    }).catch(err => {
      console.error('Error calling n8n webhook:', err);
    });

    // Return 1x1 pixel immediately
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(pixel);

  } catch (error) {
    console.error('Tracking pixel error:', error);
    // Still return pixel even on error
    res.status(200).end(pixel);
  }
});

/**
 * Click tracking redirect endpoint
 * GET /track/click?q=QUEUE_ID&c=CAMPAIGN_ID&u=BASE64_URL&t=TIMESTAMP
 */
app.get('/track/click', async (req, res) => {
  const { q: queueId, c: campaignId, u: encodedUrl, t: timestamp } = req.query;

  try {
    // Decode target URL
    const targetUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');

    // Log click event
    console.log('Click event:', {
      queueId,
      campaignId,
      targetUrl,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    // Call n8n webhook (non-blocking)
    fetch(`${N8N_BASE_URL}/webhook/email-clicked`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WEBHOOK_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        queue_id: queueId,
        campaign_id: campaignId,
        clicked_at: new Date().toISOString(),
        target_url: targetUrl,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip
      })
    }).catch(err => {
      console.error('Error calling n8n webhook:', err);
    });

    // Redirect to target URL
    res.redirect(302, targetUrl);

  } catch (error) {
    console.error('Click tracking error:', error);
    res.status(404).send('Link not found');
  }
});

/**
 * Generate tracking pixel URL
 * POST /api/generate-pixel
 * Body: { queueId, campaignId, email }
 */
app.post('/api/generate-pixel', (req, res) => {
  const { queueId, campaignId, email } = req.body;

  if (!queueId || !campaignId || !email) {
    return res.status(400).json({
      error: 'Missing required parameters: queueId, campaignId, email'
    });
  }

  const encodedEmail = Buffer.from(email).toString('base64');
  const timestamp = Date.now();
  const pixelUrl = `${req.protocol}://${req.get('host')}/track/pixel?q=${queueId}&c=${campaignId}&e=${encodedEmail}&t=${timestamp}`;

  res.json({ pixelUrl });
});

/**
 * Wrap links with click tracking
 * POST /api/wrap-links
 * Body: { htmlBody, queueId, campaignId }
 */
app.post('/api/wrap-links', (req, res) => {
  const { htmlBody, queueId, campaignId } = req.body;

  if (!htmlBody || !queueId || !campaignId) {
    return res.status(400).json({
      error: 'Missing required parameters: htmlBody, queueId, campaignId'
    });
  }

  // Find all <a> tags and wrap with tracking
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>(.*?)<\/a>/gi;

  const wrappedHtml = htmlBody.replace(linkRegex, (match, href, attrs, text) => {
    // Skip if already tracked or special links
    if (href.includes('/track/click') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#')) {
      return match;
    }

    // Create tracking URL
    const encodedUrl = Buffer.from(href).toString('base64');
    const timestamp = Date.now();
    const trackingUrl = `${req.protocol}://${req.get('host')}/track/click?q=${queueId}&c=${campaignId}&u=${encodedUrl}&t=${timestamp}`;

    return `<a href="${trackingUrl}"${attrs}>${text}</a>`;
  });

  res.json({ wrappedHtml });
});

/**
 * Test endpoint for development
 */
app.get('/test', (req, res) => {
  res.json({
    message: 'Email tracking server is running',
    endpoints: {
      health: '/health',
      trackPixel: '/track/pixel?q=QUEUE_ID&c=CAMPAIGN_ID&e=BASE64_EMAIL&t=TIMESTAMP',
      trackClick: '/track/click?q=QUEUE_ID&c=CAMPAIGN_ID&u=BASE64_URL&t=TIMESTAMP',
      generatePixel: 'POST /api/generate-pixel',
      wrapLinks: 'POST /api/wrap-links'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Email tracking server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
});

module.exports = app;
