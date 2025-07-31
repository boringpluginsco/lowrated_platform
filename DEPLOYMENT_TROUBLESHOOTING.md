# 🚀 Deployment Troubleshooting Guide

This guide addresses common deployment issues and their solutions.

## ❌ **Issue: `tsc: not found` Error**

### **Error Message**
```
> tsc -b && vite build
sh: tsc: not found
exit code: 127
```

### **Root Cause**
The TypeScript compiler (`tsc`) is not installed in the Docker build environment because:
- Dockerfile uses `npm ci --only=production` which skips dev dependencies
- TypeScript is a dev dependency needed for the build process

### **✅ Solution**

#### **Option 1: Use Updated Dockerfiles (Recommended)**
The Dockerfiles have been updated to install all dependencies:

**Frontend Dockerfile** (`Dockerfile`):
```dockerfile
# Install all dependencies (including dev dependencies for build)
RUN npm ci
```

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
# Install all dependencies (including dev dependencies)
RUN npm ci
```

#### **Option 2: Multi-stage Build (Optimized)**
Use the optimized backend Dockerfile for smaller production images:

```bash
# Use the optimized version
mv backend/Dockerfile.optimized backend/Dockerfile
```

### **🔧 Manual Fix Steps**

1. **Update package.json** (if needed):
   ```bash
   npm install --save-dev typescript
   ```

2. **Commit changes**:
   ```bash
   git add .
   git commit -m "Fix Dockerfile: install all dependencies for build"
   git push
   ```

3. **Redeploy in Coolify**

## ❌ **Issue: Build Process Fails**

### **Common Build Errors**

#### **1. Missing Dependencies**
```
Error: Cannot find module 'express'
```

**Solution**: Ensure all dependencies are in `package.json`

#### **2. TypeScript Compilation Errors**
```
error TS2307: Cannot find module './components/SomeComponent'
```

**Solution**: Check import paths and file extensions

#### **3. Vite Build Errors**
```
Error: ENOENT: no such file or directory
```

**Solution**: Verify all referenced files exist

### **🔧 Build Debugging**

#### **Local Build Test**
```bash
# Test frontend build locally
cd pr-leads-directory
npm install
npm run build

# Test backend build locally
cd backend
npm install
npm start
```

#### **Docker Build Test**
```bash
# Test frontend Docker build
docker build -t frontend-test .

# Test backend Docker build
docker build -t backend-test ./backend
```

## ❌ **Issue: Environment Variables Not Loading**

### **Error Symptoms**
- API calls fail with 500 errors
- "Missing environment variable" errors
- Services can't connect to external APIs

### **✅ Solution**

#### **1. Verify Environment Variables in Coolify**
Check that all required variables are set:

**Backend Variables**:
```env
PORT=3001
NODE_ENV=production
RESEND_API_KEY=re_your_actual_key
FROM_EMAIL=jordan@galleongroup.co
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SHEET_ID=your_sheet_id
```

**Frontend Variables**:
```env
VITE_API_URL=https://api.yourdomain.com
```

#### **2. Test Environment Variables**
```bash
# Test backend environment
curl https://api.yourdomain.com/api/diagnostics

# Expected response:
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

#### **3. Check Variable Format**
- **Google Service Account Key**: Must be entire JSON as single line
- **API Keys**: No extra spaces or quotes
- **URLs**: Include protocol (https://)

## ❌ **Issue: CORS Errors**

### **Error Message**
```
Access to fetch at 'https://api.yourdomain.com/api/health' from origin 'https://yourdomain.com' has been blocked by CORS policy
```

### **✅ Solution**

#### **1. Update CORS Configuration**
Edit `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:3000',
    'https://yourdomain.com',  // Add your production domain
    'https://www.yourdomain.com'
  ],
  credentials: true
}));
```

#### **2. Redeploy Backend**
After updating CORS, redeploy the backend service.

## ❌ **Issue: Database/File System Errors**

### **Error Symptoms**
- "Permission denied" errors
- "Cannot write to directory" errors
- Data persistence issues

### **✅ Solution**

#### **1. Check File Permissions**
The Dockerfile creates a non-root user. Ensure proper permissions:

```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs
```

#### **2. Use Volumes for Data Persistence**
In `docker-compose.yml`:
```yaml
volumes:
  - ./backend/data:/app/data
```

## ❌ **Issue: Health Check Failures**

### **Error Message**
```
Health check failed: exit code 1
```

### **✅ Solution**

#### **1. Verify Health Check Endpoint**
```bash
curl https://api.yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Email service is running"
}
```

#### **2. Check Health Check Configuration**
The Dockerfile includes:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
```

#### **3. Increase Start Period**
If the app takes longer to start:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
```

## ❌ **Issue: Email Service Not Working**

### **Error Symptoms**
- Emails not sending
- "Failed to send email" errors
- Resend API errors

### **✅ Solution**

#### **1. Verify Resend Configuration**
```bash
# Test email endpoint
curl -X POST https://api.yourdomain.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

#### **2. Check Resend API Key**
- Verify API key is correct
- Check API key permissions
- Ensure domain is verified in Resend

#### **3. Check FROM_EMAIL**
- Must be a verified domain in Resend
- Format: `jordan@galleongroup.co`

## ❌ **Issue: Google Sheets Integration Fails**

### **Error Symptoms**
- "Failed to fetch Google Sheet data" errors
- Authentication errors
- Permission denied errors

### **✅ Solution**

#### **1. Verify Service Account**
- Check service account JSON format
- Ensure service account has access to the sheet
- Verify Google Sheets API is enabled

#### **2. Test Google Sheets Connection**
```bash
# Test sheet info endpoint
curl https://api.yourdomain.com/api/sheets/info/YOUR_SHEET_ID
```

#### **3. Check Sheet Permissions**
- Share the Google Sheet with the service account email
- Ensure the service account has at least "Viewer" permissions

## 🔧 **General Troubleshooting Steps**

### **1. Check Logs**
```bash
# View container logs
docker logs <container_name>

# View Coolify logs
# Check the Coolify dashboard for service logs
```

### **2. Verify Network Connectivity**
```bash
# Test backend connectivity
curl https://api.yourdomain.com/api/health

# Test frontend connectivity
curl https://yourdomain.com
```

### **3. Check Resource Usage**
- Monitor CPU and memory usage
- Ensure sufficient resources allocated
- Check disk space

### **4. Validate Configuration**
```bash
# Test all endpoints
curl https://api.yourdomain.com/api/health
curl https://api.yourdomain.com/api/diagnostics
curl -X POST https://api.yourdomain.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

## 📞 **Getting Help**

### **Debug Information to Collect**
1. **Error logs** from Coolify dashboard
2. **Environment variables** (without sensitive values)
3. **Docker build logs**
4. **Network connectivity test results**
5. **Health check endpoint responses**

### **Common Solutions Summary**
- ✅ **Build issues**: Use `npm ci` instead of `npm ci --only=production`
- ✅ **Environment variables**: Verify all required variables are set
- ✅ **CORS issues**: Update CORS configuration with production domains
- ✅ **Permission issues**: Check file permissions and user configuration
- ✅ **Service connectivity**: Test all endpoints and verify network configuration

---

**Remember**: Always test changes locally before deploying to production! 🚀 