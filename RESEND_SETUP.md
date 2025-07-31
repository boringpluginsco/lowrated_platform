# 📧 Resend + ImprovMX Email Integration Setup

This guide will help you set up and test the Resend email sending and ImprovMX email receiving functionality in your B2B Business Directory application.

## 🚀 Quick Start

### 1. Backend Setup
```bash
# Navigate to the backend directory
cd pr-leads-directory/backend

# Install dependencies (already done)
npm install

# Start the backend server
npm run dev
```

The backend will start on `http://localhost:3001` and you should see:
```
📧 Email service running on port 3001
📋 Health check available at: http://localhost:3001/api/health
✉️  Send email endpoint: http://localhost:3001/api/send-email
🧪 Test email endpoint: http://localhost:3001/api/test-email
📨 Inbound webhook: http://localhost:3001/api/email/inbound
```

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd pr-leads-directory

# Start the frontend (if not already running)
npm run dev
```

## 🔑 Environment Setup

### Backend Environment Variables
Create or update `pr-leads-directory/backend/.env`:
```env
# Resend Email Service Configuration
RESEND_API_KEY=re_your_resend_api_key_here

# Email Settings
FROM_EMAIL=jordan@galleongroup.co

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Get Your Resend API Key
1. Sign up at [https://resend.com](https://resend.com)
2. Verify your domain (`galleongroup.co`)
3. Create an API key
4. Add it to your `.env` file

## 📨 ImprovMX Configuration

### 1. Domain Setup
1. Go to [https://improvmx.com](https://improvmx.com)
2. Add your domain: `galleongroup.co`
3. Configure DNS records as instructed

### 2. Webhook Configuration
Set up a catch-all alias to forward to your webhook:

**Alias:** `*@galleongroup.co`
**Forward To:** `https://yourdomain.com/api/email/inbound`

*Note: Replace `yourdomain.com` with your actual domain where the backend is deployed*

## 🧪 Testing Email Integration

### Method 1: Test Email Endpoint (Backend Only)
```bash
# Test the backend directly
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "details": {
    "to": "your-email@example.com",
    "messageId": "resend-message-id"
  }
}
```

### Method 2: Frontend Test Button
1. Open the app in your browser (`http://localhost:5173`)
2. Navigate to **Messages** page
3. Click **Email** mode toggle (bottom left)
4. Click the **🧪 Test** button
5. Check for success/error message

### Method 3: Send Actual Email
1. Navigate to **Messages** page in the app
2. Click **Email** mode toggle
3. Fill out the email form:
   - **To**: Enter a valid email address
   - **Subject**: Enter a subject
   - **Body**: Enter your message
4. Click **Send** button
5. Check the email status message
6. Verify email delivery

### Method 4: Test Inbound Webhook
```bash
# Simulate an inbound email
curl -X POST http://localhost:3001/api/email/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "reply@galleongroup.co",
    "subject": "Test Reply",
    "html": "<p>This is a test reply</p>",
    "text": "This is a test reply"
  }'
```

## 📱 Using the Email Feature

### From the Messaging Center:
1. **Star businesses** in the Directory first
2. Go to **Messages** page
3. Toggle to **Email** mode (bottom left)
4. Select a business from the sidebar
5. Click **✉️ Compose New Email** or use the compose form
6. Fill out and send your email

### Email Form Features:
- ✅ **Real-time validation** (email format, required fields)
- ⏳ **Loading states** with spinner
- ✉️ **Success/error messages**
- 🧪 **Test email function**
- 📧 **Email thread tracking** (local storage)
- 🎨 **Theme-aware UI** (light/dark mode)
- 📨 **Inbound email webhook** for replies

## 🔧 Advanced Configuration

### Custom From Address
To use a custom sender name and email:
```javascript
const emailData = {
  from: 'Your Name <yourname@galleongroup.co>',
  to: 'recipient@example.com',
  subject: 'Your Subject',
  html: 'Your HTML content'
};
```

### Email Threading
Emails sent through the system include metadata for threading. Replies received via ImprovMX webhook will be processed and can be displayed in your inbox UI.

## 📧 Email Features

### ✨ What's Implemented:
- **Resend API integration** with proper error handling
- **Email validation** (format, required fields)
- **Loading states** with visual feedback
- **Success/error notifications** 
- **Test email functionality**
- **Inbound email webhook** for ImprovMX
- **Email thread management** (local storage)
- **Theme compatibility** (dark/light mode)
- **Professional email templates** with HTML formatting
- **Security features** (CORS, validation, headers)

### 📋 Email Format:
Emails are sent with:
- **Professional HTML template** with styling
- **Plain text fallback** for compatibility
- **Branded footer** identifying the platform
- **Proper email headers** and metadata
- **Support for custom sender names**

## 🔍 Troubleshooting

### ❌ Backend Not Starting
```bash
# Check if port is in use
lsof -ti:3001

# Kill process if needed
kill -9 $(lsof -ti:3001)

# Restart backend
npm run dev
```

### ❌ Email Not Sending
1. **Check API key**: Verify `RESEND_API_KEY` is correctly set in `.env`
2. **Check domain verification**: Ensure your domain is verified in Resend
3. **Check email format**: Must be valid email address
4. **Check console logs**: Look for detailed error messages
5. **Check Resend dashboard**: Monitor sending statistics

### ❌ Inbound Emails Not Working
1. **Check ImprovMX configuration**: Verify webhook URL is correct
2. **Check DNS records**: Ensure MX records are properly configured
3. **Test webhook locally**: Use ngrok or similar for local testing
4. **Check server logs**: Monitor `/api/email/inbound` endpoint

### 🔧 Local Development with Webhooks
For testing inbound emails locally:

1. **Install ngrok**: `npm install -g ngrok`
2. **Expose local server**: `ngrok http 3001`
3. **Update ImprovMX webhook**: Use ngrok URL `https://abc123.ngrok.io/api/email/inbound`
4. **Test with real emails**: Send emails to your domain

## 📊 Monitoring

### Diagnostics Endpoint
Check system status:
```bash
curl http://localhost:3001/api/diagnostics
```

Response includes:
- API key status
- Email configuration
- Service information

### Logs
Monitor backend logs for:
- Email sending confirmations
- Inbound webhook calls
- Error messages
- Message IDs for tracking

## 🚀 Deployment

### Environment Variables for Production
```env
RESEND_API_KEY=your-production-resend-api-key
FROM_EMAIL=jordan@galleongroup.co
PORT=3001
NODE_ENV=production
```

### ImprovMX Production Setup
Update webhook URL to your production domain:
`https://yourproductiondomain.com/api/email/inbound`

---

## ✅ Migration Complete

**SendGrid has been completely removed and replaced with:**
- ✅ Resend for email sending
- ✅ ImprovMX webhook for email receiving
- ✅ Updated documentation
- ✅ Cleaned up old dependencies
- ✅ Enhanced error handling
- ✅ Professional email templates 