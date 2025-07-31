# 🚀 Production Email Inbox Setup

This guide will help you configure the email inbox functionality for production deployment.

## 🔧 **Issue Fixed**

The blank page issue was caused by the frontend trying to connect to `localhost:3001` instead of the production backend URL.

## ✅ **Configuration Required**

### 1. **Frontend Environment Variables**

Create a `.env` file in the frontend directory (`pr-leads-directory/`) with:

```env
# Production API URL
VITE_API_URL=https://your-backend-domain.com/api
```

**Replace `your-backend-domain.com` with your actual backend domain.**

### 2. **Backend Environment Variables**

Ensure your backend has the correct environment variables:

```env
# Backend .env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=jordan@galleongroup.co
PORT=3001
NODE_ENV=production
```

## 🌐 **Domain Configuration**

### **Frontend Domain**
- Your frontend should be accessible at: `https://your-frontend-domain.com`
- Users will access the email inbox at: `https://your-frontend-domain.com/email-inbox`

### **Backend Domain**
- Your backend should be accessible at: `https://your-backend-domain.com`
- The API endpoints will be at: `https://your-backend-domain.com/api/*`

### **ImprovMX Configuration**
Update your ImprovMX webhook to point to your production backend:

**Forward To:** `https://your-backend-domain.com/api/email/inbound`

## 🔍 **Testing Production Setup**

### 1. **Test the API Connection**
Visit: `https://your-backend-domain.com/api/health`
Should return: `{"status":"OK","message":"Email service is running"}`

### 2. **Test Email Inbox**
1. Navigate to: `https://your-frontend-domain.com/email-inbox`
2. Click "Test Email" button
3. Should see success message and email appear in list

### 3. **Test Real Email Flow**
1. Send an email from your app to a business
2. Have the business reply to the email
3. Check the email inbox for the reply

## 🛠️ **Deployment Checklist**

### **Frontend Deployment**
- [ ] Set `VITE_API_URL` environment variable
- [ ] Build and deploy frontend
- [ ] Test email inbox page loads
- [ ] Test "Test Email" button works

### **Backend Deployment**
- [ ] Deploy backend with correct environment variables
- [ ] Test `/api/health` endpoint
- [ ] Test `/api/email/inbound` endpoint
- [ ] Configure ImprovMX webhook URL

### **Email Flow Testing**
- [ ] Send test email via frontend
- [ ] Verify email appears in inbox
- [ ] Test search and filter functionality
- [ ] Test email detail view

## 🔧 **Troubleshooting**

### **Blank Page Issues**
1. **Check Browser Console** (F12)
   - Look for CORS errors
   - Check for API connection errors
   - Verify environment variables are loaded

2. **Check Network Tab**
   - Verify API requests are going to correct URL
   - Check for 404 or 500 errors

3. **Verify Environment Variables**
   ```bash
   # Check if VITE_API_URL is set correctly
   echo $VITE_API_URL
   ```

### **API Connection Issues**
1. **Test Backend Health**
   ```bash
   curl https://your-backend-domain.com/api/health
   ```

2. **Test Email Endpoint**
   ```bash
   curl https://your-backend-domain.com/api/email/inbound
   ```

3. **Check CORS Configuration**
   Ensure backend allows requests from your frontend domain.

### **Email Not Appearing**
1. **Check Backend Logs**
   - Look for webhook processing errors
   - Verify email storage

2. **Check ImprovMX Configuration**
   - Verify webhook URL is correct
   - Test webhook delivery

3. **Check File Permissions**
   - Ensure backend can write to `data/inbound_emails.json`

## 📊 **Monitoring**

### **Backend Monitoring**
- Monitor `/api/health` endpoint
- Check webhook processing logs
- Monitor email storage file size

### **Frontend Monitoring**
- Monitor email inbox page load times
- Check for JavaScript errors
- Monitor API request success rates

## 🔄 **Updates Made**

### **Files Updated:**
1. **`src/components/TestWebhookButton.tsx`**
   - Fixed hardcoded localhost URL
   - Now uses `VITE_API_URL` environment variable

2. **`src/services/emailService.ts`**
   - Already using `VITE_API_URL` environment variable
   - No changes needed

### **Environment Variables:**
- **`VITE_API_URL`**: Must be set to your production backend URL

## 🎯 **Quick Fix**

If you're still seeing a blank page:

1. **Set the environment variable:**
   ```env
   VITE_API_URL=https://your-backend-domain.com/api
   ```

2. **Rebuild and redeploy the frontend**

3. **Test the connection:**
   - Visit the email inbox page
   - Click "Test Email" button
   - Check browser console for errors

## ✅ **Success Indicators**

When everything is working correctly:

- ✅ Email inbox page loads without blank screen
- ✅ "Test Email" button sends emails successfully
- ✅ Emails appear in the inbox list
- ✅ Email detail view shows full content
- ✅ Search and filter functionality works
- ✅ Real emails from ImprovMX appear in inbox

---

**Need Help?** Check the browser console (F12) for specific error messages and refer to the troubleshooting section above. 