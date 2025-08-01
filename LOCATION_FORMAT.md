# Location and Category Format Implementation

## Overview

The application now uses standardized formats for both locations and categories in all API calls and data storage.

- **Locations**: Formatted as `"US>XX"` where `XX` is the two-letter state code
- **Categories**: Use predefined business category names with proper formatting

## Implementation Details

### Location Format
- **Format**: `"US>XX"` where XX is the state code
- **Example**: `"US>AK"` for Alaska, `"US>CA"` for California

### Category Format
- **Format**: Predefined category names (e.g., "restaurant", "attorney", "auto repair shop")
- **Display**: Properly formatted for UI (e.g., "Auto Repair Shop", "Business Management Consultant")
- **Examples**: "fast food restaurant", "real estate agency", "medical clinic"

### Data Sources
- **Locations**: Extracted from `src/data/zipcodes.us.json`
- **Categories**: Predefined list in `src/utils/categoryUtils.ts`
- The system automatically formats both for display and API usage

### Frontend Implementation

#### Location Dropdown
- Located in `src/pages/DashboardPage.tsx`
- Uses `getStateOptions()` from `src/utils/locationUtils.ts`
- Displays states in format: "State Name, XX" (e.g., "Alaska, AK")
- Stores values in format: "US>XX" (e.g., "US>AK")

#### Category Dropdown
- Located in `src/pages/DashboardPage.tsx`
- Uses `getCategoryOptions()` from `src/utils/categoryUtils.ts`
- Displays categories in format: "Properly Formatted Name" (e.g., "Auto Repair Shop")
- Stores values in format: "auto repair shop" (lowercase with spaces)

#### API Integration
- When making API calls, both location and category are automatically formatted
- Location uses `formatLocationForJSON()` for format: `"US>XX"`
- Category uses `formatCategoryForJSON()` for proper category names

### Utility Functions

#### Location Functions
- `getStateOptions()` - Extracts unique states from zipcodes data
- `formatLocationForJSON(locationValue: string)` - Converts location to required format
- `getStateCodeFromLocation(locationValue: string)` - Extracts state code from formatted location

#### Category Functions
- `getCategoryOptions()` - Returns formatted category options for dropdown
- `formatCategoryDisplayName(category: string)` - Formats category for display
- `formatCategoryForJSON(category: string)` - Formats category for API payload
- `getCategoryByValue(value: string)` - Gets category option by value
- `searchCategories(searchTerm: string)` - Searches categories by name

## Example Usage

```typescript
// Location Example:
// In the dropdown, user sees: "Alaska, AK"
// The value stored is: "US>AK"

// Category Example:
// In the dropdown, user sees: "Auto Repair Shop"
// The value stored is: "auto repair shop"

// When making API calls:
const payload = {
  location: "US>AK",           // Formatted location
  category: "auto repair shop", // Formatted category
  limit: 50
};
```

## API Flow

### Scraping Process
1. **Initial Request**: POST to `/scrape_google_data` with location, category, and limit
2. **Response**: Returns `{ taskID: "{{ $json.metadata.id }}" }`
3. **Status Update**: Job status changes to "ready_for_download"
4. **Download Request**: POST to `/get_scraped_google_data` with taskID
5. **Download Response**: Returns `{ downloadUrl: "..." }`
6. **File Download**: User can download the file using the provided URL

### API Endpoints
- **Scraping**: `https://aramexshipping.app.n8n.cloud/webhook/scrape_google_data`
- **Download**: `https://aramexshipping.app.n8n.cloud/webhook/get_scraped_google_data`

## Benefits

1. **Consistency**: All locations and categories follow standardized formats
2. **Scalability**: Easy to add more countries/regions and categories in the future
3. **Data Integrity**: Uses official state codes and predefined category names
4. **User-Friendly**: Displays readable state names and properly formatted categories in the UI
5. **API Compatibility**: Ensures proper format for external APIs
6. **Maintainability**: Centralized category and location management
7. **Asynchronous Processing**: Supports long-running scraping jobs with task tracking

## File Structure

- `src/utils/locationUtils.ts` - Core location utilities
- `src/utils/categoryUtils.ts` - Core category utilities
- `src/data/zipcodes.us.json` - Source data for US states
- `src/pages/DashboardPage.tsx` - Location and category dropdown implementation 