const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { getResendClient } = require('./lib/resend.js');
const GoogleSheetsService = require('./lib/googleSheets.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
// CORS configuration - more flexible for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://localhost:3000',
      'https://lowrated-platform.vercel.app',
      'https://lowratedplatform-production.up.railway.app',
      'https://lowratedplatform.vercel.app',
      'https://lowratedplatform-production.up.railway.app'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } 
    // Allow Vercel preview deployments (any URL ending with .vercel.app)
    else if (origin.endsWith('.vercel.app')) {
      console.log('✅ Allowing Vercel preview deployment:', origin);
      callback(null, true);
    }
    else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email service is running' });
});

// API key validation endpoint
app.get('/api/validate-key', async (req, res) => {
  try {
    // Test API key by making a simple request to SendGrid
    const testRequest = await fetch('https://api.sendgrid.com/v3/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (testRequest.ok) {
      const profile = await testRequest.json();
      res.json({
        success: true,
        message: 'API key is valid',
        profile: {
          username: profile.username,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name
        }
      });
    } else {
      const errorData = await testRequest.json();
      res.status(testRequest.status).json({
        success: false,
        error: 'API key validation failed',
        status: testRequest.status,
        details: errorData
      });
    }
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key',
      details: error.message
    });
  }
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body, from, fromName } = req.body;

    // Validation
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and body are required'
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format'
      });
    }

    // Ensure we always use verified domain for sending
    const fromEmail = process.env.FROM_EMAIL || 'jordan@galleongroup.co';
    const senderName = fromName || 'Import Notice';

    const emailData = {
      from: `${senderName} <${fromEmail}>`,
      to,
      subject,
      html: `
        <p>Hi there,</p>
        <p>${body.replace(/\n/g, '<br>')}</p>
        <p>Best regards,<br>${senderName}</p>
      `,
      text: body // Plain text fallback
    };
    

    const resend = getResendClient();
    const response = await resend.emails.send(emailData);
    
    console.log('Full Resend response:', JSON.stringify(response, null, 2));
    console.log(`Email sent successfully to ${to}. Message ID: ${response.id}`);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: response.id
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Bulk email (mail merge) endpoint
app.post('/api/send-bulk-email', async (req, res) => {
  try {
    const { recipients, template, from, fromName } = req.body;

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required and must not be empty'
      });
    }

    if (!template || !template.subject || !template.body) {
      return res.status(400).json({
        success: false,
        error: 'Template with subject and body is required'
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Ensure we always use verified domain for sending
    const fromEmail = process.env.FROM_EMAIL || 'jordan@galleongroup.co';
    const senderName = fromName || 'Jordan';

    const results = [];
    const resend = getResendClient();

    // Process recipients sequentially with 3-second delay
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Validate recipient email
        if (!recipient.email || !emailRegex.test(recipient.email)) {
          results.push({
            success: false,
            recipient: recipient.email,
            businessName: recipient.business?.name || 'Unknown',
            error: 'Invalid email address format'
          });
          continue;
        }

        // Replace placeholders in template
        const personalizedSubject = replacePlaceholders(template.subject, recipient.business);
        const personalizedBody = replacePlaceholders(template.body, recipient.business);

        const emailData = {
          from: `${senderName} <${fromEmail}>`,
          to: recipient.email,
          subject: personalizedSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <div style="background-color: white; padding: 20px; border-radius: 4px; line-height: 1.6;">
                  ${personalizedBody.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
                  <p>Sent from B2B Business Directory platform</p>
                </div>
              </div>
            </div>
          `,
          text: personalizedBody
        };

        console.log(`📧 Sending email ${i + 1}/${recipients.length} to ${recipient.email} (${recipient.business?.name})`);
        
        const response = await resend.emails.send(emailData);
        
        results.push({
          success: true,
          recipient: recipient.email,
          businessName: recipient.business?.name || 'Unknown',
          messageId: response.id,
          subject: personalizedSubject
        });

        console.log(`✅ Email sent successfully to ${recipient.email}. Message ID: ${response.id}`);

        // Add 3-second delay between emails (except for the last one)
        if (i < recipients.length - 1) {
          console.log(`⏳ Waiting 3 seconds before next email...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`❌ Error sending email to ${recipient.email}:`, error);
        results.push({
          success: false,
          recipient: recipient.email,
          businessName: recipient.business?.name || 'Unknown',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`📊 Mail merge campaign completed: ${successCount} successful, ${failureCount} failed`);

    res.json({
      success: true,
      message: `Mail merge campaign completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: recipients.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error in bulk email sending:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk emails',
      details: error.message
    });
  }
});

// Helper function to replace placeholders in email template
function replacePlaceholders(text, business) {
  if (!business) return text;

  // Get email for this business
  let email;
  if (business.email_1) {
    email = business.email_1;
  } else if (business.domain && business.domain !== '-') {
    const cleanDomain = business.domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
    email = `info@${cleanDomain}`;
  } else {
    email = `contact@${business.name.toLowerCase().replace(/\s+/g, '')}.com`;
  }

  const contactName = business.name.split(' ')[0] + ' Manager';

  return text
    .replace(/<<business_name>>/g, business.name)
    .replace(/<<contact_name>>/g, contactName)
    .replace(/<<rating>>/g, business.rating?.toString() || '0')
    .replace(/<<email>>/g, email);
}

// Resend diagnostics endpoint
app.get('/api/diagnostics', async (req, res) => {
  try {
    const diagnostics = {
      apiKey: process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing',
      apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      fromEmail: process.env.FROM_EMAIL || 'jordan@galleongroup.co',
      port: process.env.PORT || 3001,
      service: 'Resend'
    };

    res.json({
      success: true,
      diagnostics
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      diagnostics: {
        apiKey: process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing',
        apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
        fromEmail: process.env.FROM_EMAIL || 'jordan@galleongroup.co',
        service: 'Resend',
        status: '❌ Failed'
      }
    });
  }
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    // Use a real email address or allow override
    const testToEmail = req.body.to || 'test@example.com';
    
    const testEmail = {
      to: testToEmail,
      subject: 'Test Email from Jordan',
      body: 'This is a test email to verify Resend integration is working correctly!'
    };

    const emailData = {
      from: 'Jordan <jordan@galleongroup.co>',
      to: testEmail.to,
      subject: testEmail.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">✅ Resend Test Email</h2>
            <div style="background-color: white; padding: 20px; border-radius: 4px; line-height: 1.6;">
              <p><strong>Congratulations!</strong></p>
              <p>${testEmail.body}</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
              <p>This is a test email from the B2B Business Directory platform.</p>
            </div>
          </div>
        </div>
      `,
      text: testEmail.body
    };

    const resend = getResendClient();
    const response = await resend.emails.send(emailData);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        to: testEmail.to,
        messageId: response.id
      }
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

// Webhook endpoint for inbound emails (ImprovMX)
app.post('/api/email/inbound', async (req, res) => {
  try {
    const { from, to, subject, html, text, headers, attachments } = req.body;
    
    console.log('📨 Received inbound email:', {
      from,
      to,
      subject,
      timestamp: new Date().toISOString()
    });

    // Parse email data
    const emailData = {
      id: `received_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: from || 'unknown@example.com',
      to: to || 'jordan@galleongroup.co',
      subject: subject || 'No Subject',
      body: html || text || '',
      text: text || '',
      html: html || '',
      timestamp: new Date(),
      direction: 'received',
      headers: headers || {},
      attachments: attachments || []
    };

    // Extract business ID from email subject or body
    // Look for patterns like "Re: [Business Name]" or similar
    const businessId = extractBusinessIdFromEmail(emailData);
    
    // Store the email in a simple file-based system for now
    // In production, you'd want to use a proper database
    await storeInboundEmail(emailData, businessId);
    
    console.log('✅ Inbound email processed and stored');
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing inbound email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process inbound email',
      details: error.message
    });
  }
});

// Helper function to extract business ID from email
function extractBusinessIdFromEmail(emailData) {
  // Try to extract business ID from subject line
  const subject = emailData.subject.toLowerCase();
  const body = emailData.body.toLowerCase();
  
  // Look for common reply patterns
  if (subject.includes('re:') || subject.includes('reply:')) {
    // Extract business name from subject
    const businessNameMatch = emailData.subject.match(/re:\s*(.+?)(?:\s*-\s*|$)/i);
    if (businessNameMatch) {
      const businessName = businessNameMatch[1].trim();
      // You could implement a lookup here to find the business ID
      return businessName; // For now, return the business name
    }
  }
  
  // Look for business name in email body
  const businessNameInBody = extractBusinessNameFromBody(emailData.body);
  if (businessNameInBody) {
    return businessNameInBody;
  }
  
  return null;
}

// Helper function to extract business name from email body
function extractBusinessNameFromBody(body) {
  // Simple regex to find business names (capitalized words)
  const businessNameMatch = body.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/);
  return businessNameMatch ? businessNameMatch[0] : null;
}

// Store inbound email in a JSON file
async function storeInboundEmail(emailData, businessId) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const emailsFile = path.join(__dirname, 'data', 'inbound_emails.json');
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(emailsFile), { recursive: true });
    
    // Read existing emails
    let emails = [];
    try {
      const existingData = await fs.readFile(emailsFile, 'utf8');
      emails = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
      emails = [];
    }
    
    // Add new email
    emails.push({
      ...emailData,
      businessId,
      receivedAt: new Date().toISOString()
    });
    
    // Write back to file
    await fs.writeFile(emailsFile, JSON.stringify(emails, null, 2));
    
    console.log(`📝 Email stored for business: ${businessId || 'unknown'}`);
  } catch (error) {
    console.error('Error storing inbound email:', error);
    throw error;
  }
}

// Get inbound emails endpoint
app.get('/api/email/inbound', async (req, res) => {
  try {
    console.log('📧 Inbound emails request received from:', req.headers.origin);
    console.log('📧 Request headers:', req.headers);
    
    const { businessId, limit = 50 } = req.query;
    const fs = require('fs').promises;
    const path = require('path');
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    try {
      await fs.access(dataDir);
    } catch (error) {
      console.log('📁 Creating data directory...');
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    const emailsFile = path.join(dataDir, 'inbound_emails.json');
    
    let emails = [];
    try {
      const existingData = await fs.readFile(emailsFile, 'utf8');
      console.log('📁 Read existing data:', existingData.substring(0, 100) + '...');
      emails = JSON.parse(existingData);
      console.log('📁 Parsed emails successfully, count:', emails.length);
    } catch (error) {
      console.log('📁 Error reading/parsing emails file:', error.message);
      console.log('📁 Starting with empty array');
      // File doesn't exist or is invalid JSON, return empty array
      emails = [];
    }
    
    // Filter by business ID if provided
    if (businessId) {
      emails = emails.filter(email => email.businessId === businessId);
    }
    
    // Sort by timestamp (newest first) and limit results
    emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
    emails = emails.slice(0, parseInt(limit));
    
    console.log(`📧 Returning ${emails.length} emails`);
    
    res.json({
      success: true,
      data: emails,
      count: emails.length
    });
  } catch (error) {
    console.error('Error retrieving inbound emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve inbound emails',
      details: error.message
    });
  }
});

// Google Sheets endpoints
const googleSheetsService = new GoogleSheetsService();

// Update JSON from Google Sheet
app.post('/api/sheets/update-json', async (req, res) => {
  try {
    const { spreadsheetId, range = 'Sheet1!A:Z', outputPath } = req.body;
    
    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'spreadsheetId is required'
      });
    }

    console.log(`🔄 Updating JSON from Google Sheet: ${spreadsheetId}`);
    
    const result = await googleSheetsService.updateJsonFile(spreadsheetId, range, outputPath);
    
    res.json({
      success: true,
      message: 'JSON file updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating JSON from Google Sheet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update JSON from Google Sheet',
      details: error.message
    });
  }
});

// Get Google Sheet info
app.get('/api/sheets/info/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    
    console.log(`📋 Getting info for Google Sheet: ${spreadsheetId}`);
    
    const info = await googleSheetsService.getSheetInfo(spreadsheetId);
    
    res.json({
      success: true,
      data: info
    });

  } catch (error) {
    console.error('Error getting Google Sheet info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Google Sheet info',
      details: error.message
    });
  }
});

// Fetch data from Google Sheet (without saving to file)
app.get('/api/sheets/fetch/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { range = 'Sheet1!A:Z' } = req.query;
    
    console.log(`📊 Fetching data from Google Sheet: ${spreadsheetId}`);
    
    const data = await googleSheetsService.fetchSheetData(spreadsheetId, range);
    
    res.json({
      success: true,
      data: data,
      count: data.length
    });

  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Google Sheet data',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`📧 Email service running on port ${PORT}`);
  console.log(`📋 Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`✉️  Send email endpoint: http://localhost:${PORT}/api/send-email`);
  console.log(`🧪 Test email endpoint: http://localhost:${PORT}/api/test-email`);
});

module.exports = app; 