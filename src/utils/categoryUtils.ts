// Category utilities for handling business categories

export interface CategoryOption {
  value: string;
  label: string;
  displayName: string;
}

// Predefined categories list
export const CATEGORIES = [
  "accountant",
  "attorney",
  "auto body shop",
  "auto parts store",
  "auto repair shop",
  "bakery",
  "bar",
  "barber shop",
  "beauty salon",
  "business management consultant",
  "cardiologist",
  "car repair",
  "cell phone store",
  "chiropractor",
  "clothing store",
  "coffee shop",
  "contractor",
  "convenience store",
  "counselor",
  "day care center",
  "dentist",
  "electrician",
  "employment agency",
  "fast food restaurant",
  "financial planner",
  "fitness center",
  "furniture store",
  "gift shop",
  "grocery store",
  "gym",
  "hair salon",
  "home builder",
  "home health care service",
  "hotel",
  "insurance agency",
  "internist",
  "investment service",
  "law firm",
  "loan agency",
  "marketing agency",
  "massage therapist",
  "medical clinic",
  "mexican restaurant",
  "mortgage lender",
  "nail salon",
  "non-profit organization",
  "nurse practitioner",
  "obstetrician-gynecologist",
  "optometrist",
  "painter",
  "pediatrician",
  "pharmacy",
  "photographer",
  "physical therapist",
  "pizza restaurant",
  "plumber",
  "podiatrist",
  "psychologist",
  "psychiatrist",
  "real estate agency",
  "real estate agent",
  "restaurant",
  "roofing contractor",
  "school",
  "self-storage facility",
  "social services organization",
  "software company",
  "tax preparation service"
];

/**
 * Get category options formatted for dropdown
 */
export function getCategoryOptions(): CategoryOption[] {
  return CATEGORIES.map(category => ({
    value: category,
    label: formatCategoryDisplayName(category),
    displayName: formatCategoryDisplayName(category)
  }));
}

/**
 * Format category name for display (capitalize and replace hyphens/underscores)
 * @param category - The raw category string
 * @returns Formatted display name
 */
export function formatCategoryDisplayName(category: string): string {
  return category
    .split(/[\s-_]+/) // Split by spaces, hyphens, or underscores
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format category for JSON payload
 * @param category - The selected category value
 * @returns The category in the required format
 */
export function formatCategoryForJSON(category: string): string {
  // Categories are already in the correct format, just return as is
  return category;
}

/**
 * Get category by value
 * @param value - The category value
 * @returns CategoryOption or undefined if not found
 */
export function getCategoryByValue(value: string): CategoryOption | undefined {
  return getCategoryOptions().find(cat => cat.value === value);
}

/**
 * Search categories by display name
 * @param searchTerm - The search term
 * @returns Array of matching CategoryOption
 */
export function searchCategories(searchTerm: string): CategoryOption[] {
  const options = getCategoryOptions();
  const term = searchTerm.toLowerCase();
  
  return options.filter(cat => 
    cat.displayName.toLowerCase().includes(term) ||
    cat.value.toLowerCase().includes(term)
  );
} 