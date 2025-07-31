const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    this.sheets = google.sheets({ version: 'v4' });
    this.auth = null;
  }

  // Initialize authentication
  async initializeAuth() {
    try {
      // For service account authentication
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        this.auth = new google.auth.GoogleAuth({
          credentials: serviceAccountKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
      } else {
        // For API key authentication (limited to public sheets)
        this.auth = new google.auth.GoogleAuth({
          key: process.env.GOOGLE_API_KEY,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
      }
      
      console.log('✅ Google Sheets authentication initialized');
    } catch (error) {
      console.error('❌ Google Sheets authentication failed:', error.message);
      throw error;
    }
  }

  // Fetch data from Google Sheet
  async fetchSheetData(spreadsheetId, range = 'Sheet1!A:Z') {
    try {
      if (!this.auth) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        throw new Error('No data found in the specified range');
      }

      // Get headers from first row
      const headers = rows[0];
      const data = rows.slice(1).map((row, index) => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });

      console.log(`✅ Fetched ${data.length} rows from Google Sheet`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching Google Sheet data:', error.message);
      throw error;
    }
  }

  // Transform Google Sheet data to match the expected JSON format
  transformSheetDataToBusinesses(sheetData) {
    return sheetData.map((row, index) => ({
      query: row.query || `doctor, ${row.postal_code || ''}, ${row.city || ''}, ${row.country || 'NZ'}`,
      name: row.name || row.business_name || '',
      name_for_emails: row.name_for_emails || row.name || row.business_name || '',
      site: row.site || row.website || '',
      phone: row.phone || row.phone_number || '',
      full_address: row.full_address || row.address || '',
      city: row.city || '',
      postal_code: row.postal_code || '',
      country: row.country || 'New Zealand',
      country_code: row.country_code || 'NZ',
      latitude: parseFloat(row.latitude) || 0,
      longitude: parseFloat(row.longitude) || 0,
      rating: parseFloat(row.rating) || 0,
      reviews: parseInt(row.reviews) || 0,
      reviews_link: row.reviews_link || '',
      reviews_per_score_1: parseInt(row.reviews_per_score_1) || 0,
      reviews_per_score_2: parseInt(row.reviews_per_score_2) || 0,
      reviews_per_score_3: parseInt(row.reviews_per_score_3) || 0,
      reviews_per_score_4: parseInt(row.reviews_per_score_4) || 0,
      reviews_per_score_5: parseInt(row.reviews_per_score_5) || 0,
      photos_count: parseInt(row.photos_count) || 0,
      working_hours: row.working_hours || '{}',
      business_status: row.business_status || 'OPERATIONAL',
      verified: row.verified === 'true' || row.verified === true,
      email_1: row.email_1 || '',
      email_2: row.email_2 || '',
      email_3: row.email_3 || '',
      phone_1: row.phone_1 || row.phone || '',
      phone_2: row.phone_2 || '',
      phone_3: row.phone_3 || '',
      facebook: row.facebook || '',
      website_title: row.website_title || '',
      website_description: row.website_description || '',
      website_has_fb_pixel: row.website_has_fb_pixel === 'true' || row.website_has_fb_pixel === true,
      website_has_google_tag: row.website_has_google_tag === 'true' || row.website_has_google_tag === true,
      // Add any additional fields that might be in your sheet
      ...row
    }));
  }

  // Update the JSON file with fresh data
  async updateJsonFile(spreadsheetId, range = 'Sheet1!A:Z', outputPath = null) {
    try {
      console.log('🔄 Fetching data from Google Sheet...');
      const sheetData = await this.fetchSheetData(spreadsheetId, range);
      
      console.log('🔄 Transforming data...');
      const transformedData = this.transformSheetDataToBusinesses(sheetData);
      
      // Determine output path
      const defaultPath = path.join(__dirname, '..', '..', 'src', 'data', 'NZ-20250718185135s80_doctor.json');
      const finalPath = outputPath || defaultPath;
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(finalPath));
      
      // Write to JSON file
      await fs.writeJson(finalPath, transformedData, { spaces: 2 });
      
      console.log(`✅ JSON file updated successfully: ${finalPath}`);
      console.log(`📊 Total businesses: ${transformedData.length}`);
      
      return {
        success: true,
        message: 'JSON file updated successfully',
        count: transformedData.length,
        path: finalPath
      };
    } catch (error) {
      console.error('❌ Error updating JSON file:', error.message);
      throw error;
    }
  }

  // Get sheet metadata
  async getSheetInfo(spreadsheetId) {
    try {
      if (!this.auth) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.get({
        auth: this.auth,
        spreadsheetId,
      });

      return {
        title: response.data.properties.title,
        sheets: response.data.sheets.map(sheet => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          gridProperties: sheet.properties.gridProperties
        }))
      };
    } catch (error) {
      console.error('❌ Error getting sheet info:', error.message);
      throw error;
    }
  }
}

module.exports = GoogleSheetsService; 