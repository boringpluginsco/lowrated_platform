// Utility functions for persisting business data to localStorage

const STORAGE_KEYS = {
  STARRED_BUSINESSES: 'b2b_starred_businesses',
  GOOGLE_STARRED_BUSINESSES: 'b2b_google_starred_businesses', 
  BUSINESS_STAGES: 'b2b_business_stages',
  EMAIL_THREADS: 'b2b_email_threads',
  MESSAGES_BY_BUSINESS: 'b2b_messages_by_business'
} as const;

// Save starred business IDs
export function saveStarredBusinesses(businessIds: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STARRED_BUSINESSES, JSON.stringify(businessIds));
  } catch (error) {
    console.warn('Failed to save starred businesses:', error);
  }
}

// Load starred business IDs
export function loadStarredBusinesses(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STARRED_BUSINESSES);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('Failed to load starred businesses:', error);
    return [];
  }
}

// Save starred Google business IDs
export function saveStarredGoogleBusinesses(businessIds: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_STARRED_BUSINESSES, JSON.stringify(businessIds));
  } catch (error) {
    console.warn('Failed to save starred Google businesses:', error);
  }
}

// Load starred Google business IDs
export function loadStarredGoogleBusinesses(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GOOGLE_STARRED_BUSINESSES);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('Failed to load starred Google businesses:', error);
    return [];
  }
}

// Save business stages
export function saveBusinessStages(stages: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUSINESS_STAGES, JSON.stringify(stages));
  } catch (error) {
    console.warn('Failed to save business stages:', error);
  }
}

// Load business stages
export function loadBusinessStages(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS_STAGES);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('Failed to load business stages:', error);
    return {};
  }
}

// Save email threads
export function saveEmailThreads(threads: any[]): void {
  try {
    // Convert dates to strings for JSON serialization
    const serializedThreads = threads.map(thread => ({
      ...thread,
      emails: thread.emails.map((email: any) => ({
        ...email,
        timestamp: email.timestamp instanceof Date ? email.timestamp.toISOString() : email.timestamp
      }))
    }));
    localStorage.setItem(STORAGE_KEYS.EMAIL_THREADS, JSON.stringify(serializedThreads));
  } catch (error) {
    console.warn('Failed to save email threads:', error);
  }
}

// Load email threads
export function loadEmailThreads(): any[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EMAIL_THREADS);
    if (!saved) return [];
    
    const threads = JSON.parse(saved);
    // Convert timestamp strings back to Date objects
    return threads.map((thread: any) => ({
      ...thread,
      emails: thread.emails.map((email: any) => ({
        ...email,
        timestamp: new Date(email.timestamp)
      }))
    }));
  } catch (error) {
    console.warn('Failed to load email threads:', error);
    return [];
  }
}

// Save messages by business
export function saveMessagesByBusiness(messages: Record<string, any[]>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES_BY_BUSINESS, JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save messages:', error);
  }
}

// Load messages by business
export function loadMessagesByBusiness(): Record<string, any[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES_BY_BUSINESS);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('Failed to load messages:', error);
    return {};
  }
}

// Clear all persisted data (useful for logout/reset)
export function clearAllPersistedData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear persisted data:', error);
  }
} 