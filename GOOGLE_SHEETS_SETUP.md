# 📊 Google Sheets to JSON Integration Setup

This guide will help you set up automatic updates from Google Sheets to your JSON file.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd pr-leads-directory/backend
npm install
```

### 2. Set Up Google Sheets API

#### Option A: Service Account (Recommended for private sheets)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Download the JSON key file
5. Share your Google Sheet with the service account email

#### Option B: API Key (For public sheets only)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Sheets API
3. Create an API key in "Credentials"

### 3. Configure Environment Variables

Add to `pr-leads-directory/backend/.env`:

```env
# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# OR for API Key (public sheets only)
GOOGLE_API_KEY=your-api-key-here

# Your Google Sheet ID (get from URL)
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

## 📋 Google Sheet Format

Your Google Sheet should have these columns (headers in first row):

| Column | Description | Required |
|--------|-------------|----------|
| name | Business name | ✅ |
| rating | Google rating (0-5) | ✅ |
| reviews | Number of reviews | ✅ |
| full_address | Complete address | ✅ |
| city | City name | ✅ |
| phone | Phone number | ✅ |
| site | Website URL | ✅ |
| email_1 | Primary email | ❌ |
| email_2 | Secondary email | ❌ |
| email_3 | Tertiary email | ❌ |
| reviews_per_score_1 | 1-star reviews | ❌ |
| reviews_per_score_2 | 2-star reviews | ❌ |
| reviews_per_score_3 | 3-star reviews | ❌ |
| reviews_per_score_4 | 4-star reviews | ❌ |
| reviews_per_score_5 | 5-star reviews | ❌ |

## 🔄 Update Methods

### Method 1: Command Line Script
```bash
# Navigate to backend directory
cd pr-leads-directory/backend

# Update JSON from Google Sheet
npm run update-json YOUR_SHEET_ID

# Or with custom range
npm run update-json YOUR_SHEET_ID "Sheet1!A:Z"
```

### Method 2: API Endpoint
```bash
# Start the backend server
npm run dev

# Update JSON via API
curl -X POST http://localhost:3001/api/sheets/update-json \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetId": "YOUR_SHEET_ID",
    "range": "Sheet1!A:Z"
  }'
```

### Method 3: Get Sheet Info
```bash
# Get information about your sheet
curl http://localhost:3001/api/sheets/info/YOUR_SHEET_ID
```

### Method 4: Fetch Data (without saving)
```bash
# Fetch data from sheet without updating JSON
curl "http://localhost:3001/api/sheets/fetch/YOUR_SHEET_ID?range=Sheet1!A:Z"
```

## 🔧 Advanced Configuration

### Custom Output Path
```bash
# Update JSON to custom location
curl -X POST http://localhost:3001/api/sheets/update-json \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetId": "YOUR_SHEET_ID",
    "range": "Sheet1!A:Z",
    "outputPath": "/custom/path/businesses.json"
  }'
```

### Multiple Sheets
You can update different sheets for different categories:

```bash
# Medical practices
npm run update-json MEDICAL_SHEET_ID

# Restaurants
npm run update-json RESTAURANT_SHEET_ID

# Retail stores
npm run update-json RETAIL_SHEET_ID
```

## 🤖 Automation

### Cron Job (Linux/Mac)
```bash
# Add to crontab to update every hour
0 * * * * cd /path/to/pr-leads-directory/backend && npm run update-json YOUR_SHEET_ID
```

### GitHub Actions
Create `.github/workflows/update-json.yml`:

```yaml
name: Update JSON from Google Sheets

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  update-json:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: |
          cd pr-leads-directory/backend
          npm install
          npm run update-json ${{ secrets.GOOGLE_SHEET_ID }}
        env:
          GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_KEY }}
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .
          git commit -m "Update JSON from Google Sheets" || exit 0
          git push
```

## 🔍 Troubleshooting

### ❌ Authentication Errors
```bash
# Check if service account key is valid
echo $GOOGLE_SERVICE_ACCOUNT_KEY | jq .

# Verify sheet is shared with service account
# The service account email should have access to the sheet
```

### ❌ Permission Errors
```bash
# Make sure the sheet is shared with your service account email
# Or make the sheet public (for API key method)
```

### ❌ Data Format Issues
```bash
# Check your sheet headers match the expected format
# First row should contain column names
```

### ❌ Range Errors
```bash
# Verify the range format: Sheet1!A:Z
# Check if sheet name exists and has data
```

## 📊 Monitoring

### Check Update Status
```bash
# View the updated JSON file
cat pr-leads-directory/src/data/NZ-20250718185135s80_doctor.json | jq length

# Check file modification time
ls -la pr-leads-directory/src/data/NZ-20250718185135s80_doctor.json
```

### Logs
Monitor backend logs for:
- Authentication status
- Data fetch confirmations
- Transformation progress
- File write confirmations

## 🚀 Production Deployment

### Environment Variables for Production
```env
GOOGLE_SERVICE_ACCOUNT_KEY=your-production-service-account-key
GOOGLE_SHEET_ID=your-production-sheet-id
NODE_ENV=production
```

### Security Best Practices
1. Use service accounts instead of API keys
2. Limit service account permissions to read-only
3. Store credentials securely (not in code)
4. Use environment variables for all sensitive data
5. Regularly rotate service account keys

---

## ✅ Setup Complete

Your Google Sheets integration is now ready! The JSON file will be automatically updated whenever you run the update command or call the API endpoint.

**Next Steps:**
1. Test with a small sheet first
2. Set up automation (cron job or GitHub Actions)
3. Monitor the update process
4. Verify data quality in your application 