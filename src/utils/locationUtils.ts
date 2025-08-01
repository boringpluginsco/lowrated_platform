// Location utilities for handling US states and formatting

export interface ZipcodeData {
  country_code: string;
  zipcode: string;
  place: string;
  state: string;
  state_code: string;
  province: string;
  province_code: string;
  community: string;
  community_code: string;
  latitude: string;
  longitude: string;
}

export interface StateOption {
  value: string; // Format: "US>XX" where XX is state_code
  label: string; // Format: "State Name, XX"
  state_code: string;
  state_name: string;
}

// Import the zipcodes data
import zipcodesData from '../data/zipcodes.us.json';

/**
 * Extract unique states from the zipcodes data and format them for the dropdown
 */
export function getStateOptions(): StateOption[] {
  const states = new Map<string, { state_code: string; state_name: string }>();
  
  // Extract unique states from zipcodes data
  (zipcodesData as ZipcodeData[]).forEach((zipcode: ZipcodeData) => {
    // Skip entries with empty state codes or names
    if (zipcode.state_code && zipcode.state_code.trim() && zipcode.state && zipcode.state.trim()) {
      if (!states.has(zipcode.state_code)) {
        states.set(zipcode.state_code, {
          state_code: zipcode.state_code,
          state_name: zipcode.state
        });
      }
    }
  });
  
  // Convert to array and sort by state name
  return Array.from(states.values())
    .sort((a, b) => a.state_name.localeCompare(b.state_name))
    .map(state => ({
      value: `US>${state.state_code}`,
      label: `${state.state_name}, ${state.state_code}`,
      state_code: state.state_code,
      state_name: state.state_name
    }));
}

/**
 * Convert a location value to the required JSON format
 * @param locationValue - The selected location value (e.g., "US>CA")
 * @returns The location in the required format
 */
export function formatLocationForJSON(locationValue: string): string {
  // If it's already in the correct format, return as is
  if (locationValue.startsWith('US>')) {
    return locationValue;
  }
  
  // If it's a state code, format it
  if (locationValue.length === 2) {
    return `US>${locationValue.toUpperCase()}`;
  }
  
  // Default fallback
  return locationValue;
}

/**
 * Get state code from location value
 * @param locationValue - The selected location value (e.g., "US>CA")
 * @returns The state code (e.g., "CA")
 */
export function getStateCodeFromLocation(locationValue: string): string {
  if (locationValue.startsWith('US>')) {
    return locationValue.substring(3);
  }
  return locationValue;
} 