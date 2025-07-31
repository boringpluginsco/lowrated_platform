# Email Service Backend

This backend service provides Resend email functionality with ImprovMX webhook support for the B2B Business Directory application.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the `backend` directory:

```bash
# In pr-leads-directory/backend/.env
RESEND_API_KEY=your-resend-api-key-here
PORT=3001
FROM_EMAIL=jordan@galleongroup.co
```

### 3. Start the Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```
Returns server status.

### Send Email
```http
POST /api/send-email
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Your Subject",
  "body": "Your email message here",
  "from": "sender@galleongroup.co", // Optional
  "fromName": "Your Name" // Optional
}
```

### Test Email
```http
POST /api/test-email
Content-Type: application/json

{
  "to": "your-email@example.com" // Optional, defaults to test@example.com
}
```
Sends a test email to verify Resend integration.

### Inbound Email Webhook
```http
POST /api/email/inbound
Content-Type: application/json

{
  "from": "sender@example.com",
  "to": "reply@galleongroup.co",
  "subject": "Reply Subject",
  "html": "<p>HTML content</p>",
  "text": "Plain text content"
}
```
Webhook endpoint for ImprovMX to forward inbound emails.

### Diagnostics
```http
GET /api/diagnostics
```
Returns service configuration and status information.

## 🔧 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

## 🛡️ Security Features

- CORS enabled for frontend domain
- Helmet.js for security headers
- Input validation for email fields
- Email format validation
- Error handling and logging
- Webhook endpoint security

## 📧 Resend + ImprovMX Configuration

### Resend Setup
1. Sign up at [https://resend.com](https://resend.com)
2. Verify your domain (`galleongroup.co`)
3. Create an API key
4. Add to environment variables

### ImprovMX Setup
1. Configure domain at [https://improvmx.com](https://improvmx.com)
2. Set up catch-all alias: `*@galleongroup.co`
3. Forward to webhook: `https://yourdomain.com/api/email/inbound`

## 🧪 Testing

### Email Sending
1. Start the backend server
2. Use the test email endpoint: `POST /api/test-email`
3. Check the console for success/error messages
4. Verify email delivery in your inbox

### Webhook Testing
```bash
# Test inbound webhook locally
curl -X POST http://localhost:3001/api/email/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "reply@galleongroup.co",
    "subject": "Test Reply",
    "html": "<p>Test message</p>",
    "text": "Test message"
  }'
```

## 🔍 Troubleshooting

### Email Not Sending
1. Check Resend API key validity
2. Verify domain verification in Resend
3. Check console logs for errors
4. Ensure proper email format
5. Monitor Resend dashboard

### Webhook Issues
1. Verify ImprovMX configuration
2. Check webhook URL accessibility
3. Test with ngrok for local development
4. Monitor server logs for webhook calls

### CORS Issues
1. Verify frontend URL in CORS configuration
2. Check if frontend is running on expected port
3. Update CORS origins if needed

### Connection Issues
1. Ensure backend is running on port 3001
2. Check firewall settings
3. Verify network connectivity

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key | Required |
| `PORT` | Server port | 3001 |
| `FROM_EMAIL` | Default sender email | jordan@galleongroup.co |

## 🔗 Integration

The frontend automatically connects to this backend service. Ensure:

1. Backend is running before starting frontend
2. Frontend points to correct backend URL
3. CORS is properly configured
4. Environment variables are set
5. Domain is verified in Resend
6. ImprovMX webhook is configured

## 📨 Email Flow

1. **Outbound**: Frontend → Backend → Resend → Recipient
2. **Inbound**: Sender → ImprovMX → Webhook → Backend → (Database/UI)

## 🚀 Production Deployment

1. Set production environment variables
2. Configure production webhook URL in ImprovMX
3. Ensure domain verification in Resend
4. Set up proper DNS records for email delivery 