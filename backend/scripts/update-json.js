#!/usr/bin/env node

/**
 * Script to update JSON file from Google Sheets
 * Usage: node scripts/update-json.js [spreadsheetId] [range]
 */

require('dotenv').config();
const GoogleSheetsService = require('../lib/googleSheets.js');
const path = require('path');

async function updateJsonFromSheet() {
  try {
    // Get command line arguments
    const spreadsheetId = process.argv[2];
    const range = process.argv[3] || 'Sheet1!A:Z';
    
    if (!spreadsheetId) {
      console.error('❌ Please provide a spreadsheet ID');
      console.log('Usage: node scripts/update-json.js <spreadsheetId> [range]');
      console.log('Example: node scripts/update-json.js 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms Sheet1!A:Z');
      process.exit(1);
    }

    console.log('🔄 Starting JSON update from Google Sheets...');
    console.log(`📊 Spreadsheet ID: ${spreadsheetId}`);
    console.log(`📋 Range: ${range}`);

    const googleSheetsService = new GoogleSheetsService();
    
    // Update the JSON file
    const result = await googleSheetsService.updateJsonFile(spreadsheetId, range);
    
    console.log('✅ Update completed successfully!');
    console.log(`📈 Total businesses: ${result.count}`);
    console.log(`📁 File saved to: ${result.path}`);
    
  } catch (error) {
    console.error('❌ Error updating JSON:', error.message);
    process.exit(1);
  }
}

// Run the script
updateJsonFromSheet(); 