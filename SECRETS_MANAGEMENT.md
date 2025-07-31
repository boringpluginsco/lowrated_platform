# 🔐 Secrets Management Guide

This guide explains where secrets are defined and how to manage them securely in the B2B Business Listings application.

## 📍 Where Secrets Are Defined

### **Backend Secrets (Node.js)**

Secrets are accessed via `process.env.VARIABLE_NAME` in the backend:

#### **1. Server Configuration**
```javascript
// server.js
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

#### **2. Email Service (Resend)**
```javascript
// lib/resend.js
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'jordan@galleongroup.co';
```

#### **3. Google Sheets Integration**
```javascript
// lib/googleSheets.js
const GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
```

### **Frontend Secrets (React/Vite)**

Frontend secrets are accessed via `import.meta.env.VITE_VARIABLE_NAME`:

```javascript
// src/services/emailService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// src/components/GoogleSheetsUpdater.tsx
const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sheets/update-json`);
```

**Important**: Only variables prefixed with `VITE_` are accessible in the frontend.

## 🔧 Environment File Structure

### **Backend Environment (.env)**
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Resend Email Service
RESEND_API_KEY=re_your_actual_resend_api_key_here
FROM_EMAIL=jordan@galleongroup.co

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
GOOGLE_SHEET_ID=your_google_sheet_id_here

# Optional: Google API Key (for public sheets)
# GOOGLE_API_KEY=your_google_api_key_here
```

### **Frontend Environment (.env)**
```env
# API Configuration
VITE_API_URL=https://api.yourdomain.com
```

## 🛡️ Security Best Practices

### **1. Never Commit Secrets to Git**

The `.gitignore` file should exclude all environment files:

```gitignore
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# But include examples
!env.example
!backend/env.example
```

### **2. Use Environment Examples**

Always provide example files without real secrets:

- `env.example` - Frontend environment template
- `backend/env.example` - Backend environment template

### **3. Secret Rotation**

Regularly rotate sensitive secrets:
- Resend API keys
- Google service account keys
- Database passwords (if added later)

## 🚀 Deployment Secrets Configuration

### **Local Development**

1. **Create environment files**:
   ```bash
   # Backend
   cp backend/env.example backend/.env
   
   # Frontend
   cp env.example .env
   ```

2. **Add real secrets** to the `.env` files

### **Coolify Deployment**

#### **Backend Service Environment Variables**
In Coolify dashboard, add these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `RESEND_API_KEY` | Resend API key | `re_abc123...` |
| `FROM_EMAIL` | Sender email | `jordan@galleongroup.co` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google service account JSON | `{"type":"service_account",...}` |
| `GOOGLE_SHEET_ID` | Google Sheet ID | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` |

#### **Frontend Service Environment Variables**
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.yourdomain.com` |

### **GitHub Actions (Optional)**

For automated deployments, use GitHub Secrets:

```yaml
# .github/workflows/deploy.yml
env:
  RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
  GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_KEY }}
  GOOGLE_SHEET_ID: ${{ secrets.GOOGLE_SHEET_ID }}
```

## 🔍 Secret Validation

### **Backend Health Check**
The backend includes secret validation in the diagnostics endpoint:

```bash
curl https://api.yourdomain.com/api/diagnostics
```

Response includes:
```json
{
  "success": true,
  "diagnostics": {
    "apiKey": "✅ Set",
    "apiKeyLength": 32,
    "fromEmail": "jordan@galleongroup.co",
    "port": 3001,
    "service": "Resend"
  }
}
```

### **Frontend Validation**
The frontend validates API connectivity:

```javascript
// Check if API is accessible
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/health`);
if (!response.ok) {
  console.error('API not accessible');
}
```

## 🚨 Common Secret Issues

### **1. Missing Environment Variables**
```bash
# Error: RESEND_API_KEY is not defined
# Solution: Add to .env file or Coolify environment variables
```

### **2. Invalid Google Service Account Key**
```bash
# Error: Invalid service account key format
# Solution: Ensure JSON is properly formatted and complete
```

### **3. Frontend Can't Access Backend**
```bash
# Error: CORS or connection issues
# Solution: Check VITE_API_URL is correct and backend is running
```

### **4. Environment Variable Not Loading**
```bash
# Error: process.env.VARIABLE is undefined
# Solution: Restart the application after adding environment variables
```

## 🔧 Secret Management Tools

### **1. Environment Variable Validation**
```bash
# Check if all required variables are set
node -e "
const required = ['RESEND_API_KEY', 'GOOGLE_SERVICE_ACCOUNT_KEY'];
const missing = required.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('Missing variables:', missing);
  process.exit(1);
}
console.log('All required variables are set');
"
```

### **2. Secret Rotation Script**
```bash
#!/bin/bash
# rotate-secrets.sh
echo "🔐 Rotating secrets..."

# Generate new Resend API key
# Update Google service account
# Update environment variables
# Restart services

echo "✅ Secrets rotated successfully"
```

## 📋 Secret Inventory

### **Current Secrets Used**

| Secret | Purpose | Location | Required |
|--------|---------|----------|----------|
| `RESEND_API_KEY` | Email sending | Backend | ✅ |
| `FROM_EMAIL` | Sender address | Backend | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Sheets access | Backend | ✅ |
| `GOOGLE_SHEET_ID` | Target sheet | Backend | ✅ |
| `VITE_API_URL` | Backend API URL | Frontend | ✅ |
| `PORT` | Server port | Backend | ❌ (default: 3001) |
| `NODE_ENV` | Environment | Backend | ❌ (default: development) |

### **Future Secrets (If Added)**

| Secret | Purpose | When Needed |
|--------|---------|-------------|
| `DATABASE_URL` | Database connection | If adding database |
| `JWT_SECRET` | Authentication tokens | If adding JWT auth |
| `REDIS_URL` | Cache connection | If adding Redis |
| `STRIPE_SECRET_KEY` | Payment processing | If adding payments |

## 🔐 Security Checklist

- [ ] All `.env` files are in `.gitignore`
- [ ] Example files exist without real secrets
- [ ] Secrets are rotated regularly
- [ ] Environment variables are validated
- [ ] Production secrets are different from development
- [ ] Access to secrets is limited to necessary personnel
- [ ] Secrets are encrypted in transit and at rest
- [ ] Backup strategy for secrets exists

---

## 📚 Additional Resources

- [Coolify Environment Variables](https://coolify.io/docs/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#processenv)
- [Resend API Documentation](https://resend.com/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)

---

**🔐 Remember**: Never commit real secrets to version control. Always use environment variables and keep secrets secure! 