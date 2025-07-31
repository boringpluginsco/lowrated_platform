export interface Business {
    id: string;
    name: string;   // maps from Website in remote payload
    rating: number; // Rating
    reviews: number; // Reviews count
    city: string;   // derived from Address (first comma‑separated part)
    domain?: string; // new: domain field from API
    email_1?: string; // primary email address
    email_2?: string; // secondary email address
    email_3?: string; // tertiary email address
    isStarred: boolean;
  }
  
  export interface Message {
    id: string;
    text: string;
    timestamp: number;
    direction: "incoming" | "outgoing";
  }

  // Re-export auth types for convenience
  export type { User, AuthState, LoginCredentials, AuthContextType } from './types/auth';
  