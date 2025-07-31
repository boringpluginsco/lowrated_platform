# 📧 Email Reply Setup Guide

This guide will help you configure your email system to receive and display replies in your B2B Business Directory application.

## 🎯 Overview

Your current setup uses:
- **Resend** for sending emails
- **ImprovMX** for receiving emails via webhook
- **Local storage** for storing email threads
- **Enhanced webhook processing** to parse and store incoming emails

## 🔧 Backend Configuration

### 1. Enhanced Webhook Endpoint

The backend now includes an enhanced webhook endpoint at `/api/email/inbound` that:

- ✅ Parses incoming email data
- ✅ Extracts business information from subject/body
- ✅ Stores emails in a JSON file
- ✅ Associates emails with business threads
- ✅ Provides retrieval endpoint for frontend

### 2. Email Storage

Inbound emails are stored in `backend/data/inbound_emails.json` with the following structure:

```json
[
  {
    "id": "received_1234567890_abc123",
    "from": "business@example.com",
    "to": "jordan@galleongroup.co",
    "subject": "Re: Regarding your business listing",
    "body": "Thank you for reaching out...",
    "text": "Thank you for reaching out...",
    "html": "<p>Thank you for reaching out...</p>",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "direction": "received",
    "headers": {},
    "attachments": [],
    "businessId": "business_name_or_id",
    "receivedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

## 🌐 ImprovMX Configuration

### 1. Domain Setup

1. Go to [ImprovMX](https://improvmx.com)
2. Add your domain: `galleongroup.co`
3. Configure DNS records as instructed by ImprovMX

### 2. Webhook Configuration

Set up a catch-all alias to forward emails to your webhook:

**Alias:** `*@galleongroup.co`
**Forward To:** `https://yourdomain.com/api/email/inbound`

### 3. Webhook Format

ImprovMX will send emails to your webhook in this format:

```json
{
  "from": "sender@example.com",
  "to": "reply@galleongroup.co",
  "subject": "Re: Regarding your business listing",
  "html": "<p>Email content</p>",
  "text": "Email content",
  "headers": {
    "message-id": "abc123@example.com",
    "references": "def456@example.com"
  },
  "attachments": []
}
```

## 🎨 Frontend Integration

### 1. Email Synchronization

The frontend now includes:

- ✅ **Auto-sync**: Emails sync every 30 seconds when in email mode
- ✅ **Manual sync**: Sync button in email interface
- ✅ **Thread management**: Inbound emails are added to existing threads
- ✅ **Business matching**: Automatic association with businesses

### 2. Email Thread Display

Email threads now show both sent and received emails:

```typescript
interface EmailThread {
  businessId: string;
  emails: {
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp: Date;
    direction: 'sent' | 'received';
  }[];
}
```

### 3. Business Matching Logic

The system uses multiple methods to match inbound emails to businesses:

1. **Direct businessId**: If already set in the email
2. **Subject line**: Extract business name from "Re: [Business Name]"
3. **Email body**: Look for business names in the content
4. **Sender email**: Match against business email addresses

## 🚀 Deployment Setup

### 1. Production Environment Variables

```env
# Backend .env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=jordan@galleongroup.co
PORT=3001
NODE_ENV=production

# Frontend .env
VITE_API_URL=https://api.yourdomain.com/api
```

### 2. ImprovMX Production Configuration

Update your ImprovMX webhook URL to your production domain:

**Forward To:** `https://api.yourdomain.com/api/email/inbound`

### 3. SSL/HTTPS Requirements

ImprovMX requires HTTPS for webhooks. Ensure your production server has:
- Valid SSL certificate
- HTTPS enabled
- Proper firewall configuration

## 🧪 Testing

### 1. Test Webhook Locally

Use ngrok for local testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3001

# Update ImprovMX webhook to ngrok URL
# https://abc123.ngrok.io/api/email/inbound
```

### 2. Test Email Flow

1. Send an email from your app to a business
2. Have the business reply to the email
3. Check the webhook logs in your backend
4. Verify the email appears in the frontend

### 3. Manual Testing

```bash
# Test webhook endpoint
curl -X POST http://localhost:3001/api/email/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "reply@galleongroup.co",
    "subject": "Re: Regarding your business listing",
    "html": "<p>Test reply</p>",
    "text": "Test reply"
  }'

# Check stored emails
curl http://localhost:3001/api/email/inbound
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Emails Not Being Received
- ✅ Check ImprovMX configuration
- ✅ Verify webhook URL is accessible
- ✅ Check server logs for webhook calls
- ✅ Ensure HTTPS is properly configured

#### 2. Emails Not Appearing in Frontend
- ✅ Check browser console for sync errors
- ✅ Verify backend `/api/email/inbound` endpoint
- ✅ Check local storage for email threads
- ✅ Ensure business matching logic is working

#### 3. Business Matching Not Working
- ✅ Check email subject format
- ✅ Verify business names in database
- ✅ Test business name extraction logic
- ✅ Check console logs for matching attempts

### Debug Commands

```bash
# Check webhook logs
tail -f backend/logs/app.log

# Check stored emails
cat backend/data/inbound_emails.json

# Test email sync
curl http://localhost:3001/api/email/inbound?businessId=test
```

## 📊 Monitoring

### 1. Webhook Monitoring

Monitor your webhook endpoint for:
- ✅ Incoming requests
- ✅ Processing errors
- ✅ Email storage success
- ✅ Business matching results

### 2. Frontend Monitoring

Check browser console for:
- ✅ Sync attempts
- ✅ Email thread updates
- ✅ Error messages
- ✅ Business matching logs

### 3. Email Thread Statistics

Track email engagement:
- ✅ Emails sent vs received
- ✅ Response rates by business
- ✅ Thread length statistics
- ✅ Business stage progression

## 🔄 Future Enhancements

### Planned Features

1. **Database Integration**: Replace file storage with proper database
2. **Email Templates**: Pre-built reply templates
3. **Auto-Responses**: Automatic acknowledgment emails
4. **Email Analytics**: Detailed engagement metrics
5. **Advanced Matching**: AI-powered business matching
6. **Email Scheduling**: Send emails at optimal times
7. **Attachment Handling**: Process email attachments
8. **Email Search**: Search through email threads

### Performance Optimizations

1. **Caching**: Cache frequently accessed email threads
2. **Pagination**: Load emails in chunks
3. **Real-time Updates**: WebSocket for instant email updates
4. **Background Processing**: Process emails asynchronously
5. **Compression**: Compress email storage

## ✅ Checklist

### Backend Setup
- [ ] Enhanced webhook endpoint implemented
- [ ] Email storage system working
- [ ] Business matching logic functional
- [ ] Error handling in place
- [ ] Logging configured

### ImprovMX Setup
- [ ] Domain configured
- [ ] DNS records updated
- [ ] Webhook URL set
- [ ] SSL certificate valid
- [ ] Test emails received

### Frontend Integration
- [ ] Email sync functionality added
- [ ] Thread display working
- [ ] Manual sync button added
- [ ] Auto-sync configured
- [ ] Error handling implemented

### Testing
- [ ] Local testing completed
- [ ] Production deployment tested
- [ ] Email flow verified
- [ ] Business matching tested
- [ ] Error scenarios handled

---

## 🎉 Success!

Once configured, your email system will:

1. **Send emails** via Resend to businesses
2. **Receive replies** via ImprovMX webhook
3. **Store emails** in organized threads
4. **Display conversations** in your app
5. **Auto-sync** new emails every 30 seconds
6. **Match emails** to correct businesses automatically

Your B2B Business Directory now has a complete email communication system! 🚀 