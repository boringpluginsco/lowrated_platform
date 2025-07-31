# 🚀 Coolify Deployment Guide

This guide will walk you through deploying the B2B Business Listings application to Coolify.

## 📋 Prerequisites

### 1. Coolify Instance
- A running Coolify instance (self-hosted or cloud)
- Access to your Coolify dashboard

### 2. Domain Configuration
- A domain name for your application
- DNS access to configure subdomains

### 3. External Services Setup
- **Resend Account**: For email functionality
- **Google Cloud Project**: For Google Sheets integration
- **Google Sheet**: With your business data

## 🏗️ Application Architecture

The application consists of two services:

1. **Frontend**: React SPA (Port 80)
2. **Backend**: Node.js API (Port 3001)

## 📦 Deployment Steps

### Step 1: Prepare Your Repository

1. **Ensure all files are committed**:
   ```bash
   git add .
   git commit -m "Prepare for Coolify deployment"
   git push origin main
   ```

2. **Verify these files exist**:
   - `Dockerfile` (frontend)
   - `backend/Dockerfile` (backend)
   - `docker-compose.yml` (for reference)
   - `nginx.conf` (frontend configuration)

### Step 2: Configure Environment Variables

#### Frontend Environment Variables
```env
VITE_API_URL=https://api.yourdomain.com
```

#### Backend Environment Variables
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Resend Email Service
RESEND_API_KEY=re_your_actual_resend_api_key
FROM_EMAIL=jordan@galleongroup.co

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
GOOGLE_SHEET_ID=your_google_sheet_id

# Optional: Google API Key (for public sheets)
# GOOGLE_API_KEY=your_google_api_key
```

### Step 3: Deploy Backend Service

1. **In Coolify Dashboard**:
   - Click "New Resource" → "Application"
   - Choose "Docker" as source

2. **Repository Configuration**:
   - **Repository**: Your GitHub repository URL
   - **Branch**: `main`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Port**: `3001`

3. **Environment Variables**:
   - Add all backend environment variables listed above

4. **Domain Configuration**:
   - **Domain**: `api.yourdomain.com`
   - **SSL**: Enable automatic SSL

5. **Deploy Settings**:
   - **Build Command**: Leave empty (uses Dockerfile)
   - **Start Command**: Leave empty (uses Dockerfile CMD)

### Step 4: Deploy Frontend Service

1. **In Coolify Dashboard**:
   - Click "New Resource" → "Application"
   - Choose "Docker" as source

2. **Repository Configuration**:
   - **Repository**: Your GitHub repository URL
   - **Branch**: `main`
   - **Dockerfile Path**: `Dockerfile`
   - **Port**: `80`

3. **Environment Variables**:
   - `VITE_API_URL`: `https://api.yourdomain.com`

4. **Domain Configuration**:
   - **Domain**: `yourdomain.com` (or `app.yourdomain.com`)
   - **SSL**: Enable automatic SSL

5. **Deploy Settings**:
   - **Build Command**: Leave empty (uses Dockerfile)
   - **Start Command**: Leave empty (uses Dockerfile CMD)

### Step 5: Configure DNS

1. **Create DNS Records**:
   ```
   Type: A
   Name: api
   Value: [Your Coolify Server IP]
   
   Type: A
   Name: @ (or app)
   Value: [Your Coolify Server IP]
   ```

2. **Wait for DNS Propagation** (5-15 minutes)

### Step 6: Verify Deployment

1. **Check Backend Health**:
   ```bash
   curl https://api.yourdomain.com/api/health
   ```
   Expected: `{"status":"OK","message":"Email service is running"}`

2. **Check Frontend**:
   - Visit `https://yourdomain.com`
   - Should load the React application

3. **Test Email Functionality**:
   - Navigate to Messages page
   - Try sending a test email

4. **Test Google Sheets Integration**:
   - Use the Google Sheets Updater component
   - Test connection to your sheet

## 🔧 Post-Deployment Configuration

### 1. Set Up Google Sheets Integration

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable Google Sheets API

2. **Create Service Account**:
   - Go to "IAM & Admin" → "Service Accounts"
   - Create new service account
   - Download JSON key file
   - Add to backend environment variables

3. **Share Google Sheet**:
   - Share your Google Sheet with service account email
   - Grant "Viewer" permissions

### 2. Configure Resend Email

1. **Create Resend Account**:
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain (`galleongroup.co`)

2. **Get API Key**:
   - Go to API Keys section
   - Create new API key
   - Add to backend environment variables

### 3. Set Up ImprovMX (Optional)

For inbound email functionality:

1. **Configure ImprovMX**:
   - Add domain to ImprovMX
   - Set up catch-all alias: `*@galleongroup.co`
   - Forward to: `https://api.yourdomain.com/api/email/inbound`

## 🔄 Automation Setup

### 1. Google Sheets Auto-Update

Set up a cron job or GitHub Action to update JSON regularly:

```yaml
# .github/workflows/update-json.yml
name: Update JSON from Google Sheets

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  update-json:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: |
          curl -X POST https://api.yourdomain.com/api/sheets/update-json \
            -H "Content-Type: application/json" \
            -d '{"spreadsheetId": "${{ secrets.GOOGLE_SHEET_ID }}"}'
```

### 2. Health Monitoring

Set up monitoring for your services:

```bash
# Backend health check
curl https://api.yourdomain.com/api/health

# Frontend health check
curl https://yourdomain.com/health
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Frontend Can't Connect to Backend
- **Check**: `VITE_API_URL` environment variable
- **Verify**: Backend is running and accessible
- **Test**: `curl https://api.yourdomain.com/api/health`

#### 2. Email Not Sending
- **Check**: `RESEND_API_KEY` is set correctly
- **Verify**: Domain is verified in Resend
- **Test**: Use test email endpoint

#### 3. Google Sheets Not Working
- **Check**: Service account key format
- **Verify**: Sheet is shared with service account
- **Test**: Use test connection in UI

#### 4. SSL Issues
- **Check**: DNS propagation is complete
- **Verify**: Domain is correctly configured in Coolify
- **Wait**: SSL certificate generation (5-10 minutes)

### Debug Commands

```bash
# Check backend logs
docker logs [backend-container-id]

# Check frontend logs
docker logs [frontend-container-id]

# Test API endpoints
curl -X GET https://api.yourdomain.com/api/health
curl -X POST https://api.yourdomain.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'

# Check environment variables
docker exec [container-id] env | grep -E "(RESEND|GOOGLE|API)"
```

## 📊 Monitoring & Maintenance

### 1. Regular Tasks
- Monitor application logs
- Check email delivery rates
- Verify Google Sheets updates
- Update dependencies monthly

### 2. Backup Strategy
- Database backups (if added later)
- Environment variable backups
- Google Sheets data exports

### 3. Scaling Considerations
- Monitor resource usage
- Consider horizontal scaling for backend
- Implement caching for static assets

## 🎯 Success Checklist

- [ ] Backend service deployed and healthy
- [ ] Frontend service deployed and accessible
- [ ] SSL certificates working
- [ ] Email functionality tested
- [ ] Google Sheets integration working
- [ ] DNS properly configured
- [ ] Environment variables set
- [ ] Monitoring in place
- [ ] Documentation updated

## 🆘 Support

If you encounter issues:

1. Check Coolify logs in dashboard
2. Verify environment variables
3. Test individual services
4. Check DNS and SSL status
5. Review this deployment guide

---

**🎉 Congratulations!** Your B2B Business Listings application is now deployed and ready for production use. 