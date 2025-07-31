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
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], // Vite dev server and other common ports
  credentials: true
}));
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
    const { from, to, subject, html, text } = req.body;
    
    console.log('Received inbound email:', {
      from,
      to,
      subject,
      timestamp: new Date().toISOString()
    });

    // Here you would typically store the email in your database
    // For now, we'll just log it and return success
    // TODO: Implement database storage for email threads
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing inbound email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process inbound email',
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