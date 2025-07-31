#!/usr/bin/env node

/**
 * Test script for Google Sheets integration
 * This script tests the connection and data fetching without updating files
 */

require('dotenv').config();
const GoogleSheetsService = require('../lib/googleSheets.js');

async function testGoogleSheets() {
  try {
    console.log('🧪 Testing Google Sheets integration...');
    
    // Check environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_API_KEY) {
      console.error('❌ No Google authentication configured');
      console.log('Please set either GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_API_KEY in your .env file');
      process.exit(1);
    }

    const googleSheetsService = new GoogleSheetsService();
    
    // Test authentication
    console.log('🔐 Testing authentication...');
    await googleSheetsService.initializeAuth();
    console.log('✅ Authentication successful');

    // Test with a public sample sheet (Google's sample data)
    const testSheetId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    
    console.log('📊 Testing data fetch...');
    const data = await googleSheetsService.fetchSheetData(testSheetId, 'Class Data!A:E');
    
    console.log('✅ Data fetch successful');
    console.log(`📈 Fetched ${data.length} rows`);
    console.log('📋 Sample data:');
    console.log(data.slice(0, 3)); // Show first 3 rows
    
    console.log('\n🎉 All tests passed! Your Google Sheets integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your .env file has the correct credentials');
    console.log('2. Verify your Google Cloud project has Sheets API enabled');
    console.log('3. Make sure your service account has access to the sheet');
    process.exit(1);
  }
}

// Run the test
testGoogleSheets(); 