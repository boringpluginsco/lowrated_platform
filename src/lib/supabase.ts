import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we're in development and provide fallback
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!')
  console.error('❌ VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'MISSING')
  console.error('❌ VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'MISSING')
  console.error('❌ This will cause authentication to fail completely!')
} else {
  console.log('✅ Supabase environment variables found')
  console.log('🔧 URL:', supabaseUrl.substring(0, 30) + '...')
  console.log('🔧 Key length:', supabaseAnonKey.length)
}

console.log('🔧 Supabase configuration:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  keyLength: supabaseAnonKey?.length || 0,
  urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'None',
  keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'None'
});

// Create client with error handling
let supabase: SupabaseClient;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Enable automatic session persistence
      persistSession: true,
      // Store session in localStorage for persistence across browser sessions
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Auto-refresh the session before it expires
      autoRefreshToken: true,
      // Detect session in URL (for email confirmations, etc.)
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web/2.53.0'
      }
    }
  })
  console.log('✅ Supabase client created successfully')
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error)
  // Create a fallback client that will fail gracefully
  supabase = createClient('https://invalid-url.supabase.co', 'invalid-key')
}

export { supabase }

// Database types
export interface Database {
  public: {
    Tables: {
      google_businesses: {
        Row: {
          id: string
          google_business_id: string
          name: string
          rating: number | null
          reviews_count: number | null
          address: string | null
          domain: string | null
          is_verified: boolean
          social_links: any
          phone: string | null
          description: string | null
          category: string | null
          business_type: string | null
          full_address: string | null
          city: string | null
          state: string | null
          country: string | null
          latitude: number | null
          longitude: number | null
          business_status: string | null
          about: string | null
          prices: string | null
          working_hours: string | null
          email_1: string | null
          email_2: string | null
          email_3: string | null
          phone_1: string | null
          phone_2: string | null
          phone_3: string | null
          website_title: string | null
          website_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          google_business_id: string
          name: string
          rating?: number | null
          reviews_count?: number | null
          address?: string | null
          domain?: string | null
          is_verified?: boolean
          social_links?: any
          phone?: string | null
          description?: string | null
          category?: string | null
          business_type?: string | null
          full_address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          business_status?: string | null
          about?: string | null
          prices?: string | null
          working_hours?: string | null
          email_1?: string | null
          email_2?: string | null
          email_3?: string | null
          phone_1?: string | null
          phone_2?: string | null
          phone_3?: string | null
          website_title?: string | null
          website_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          google_business_id?: string
          name?: string
          rating?: number | null
          reviews_count?: number | null
          address?: string | null
          domain?: string | null
          is_verified?: boolean
          social_links?: any
          phone?: string | null
          description?: string | null
          category?: string | null
          business_type?: string | null
          full_address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          business_status?: string | null
          about?: string | null
          prices?: string | null
          working_hours?: string | null
          email_1?: string | null
          email_2?: string | null
          email_3?: string | null
          phone_1?: string | null
          phone_2?: string | null
          phone_3?: string | null
          website_title?: string | null
          website_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company: string | null
          role: 'admin' | 'user' | 'viewer'
          initials: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company?: string | null
          role?: 'admin' | 'user' | 'viewer'
          initials?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company?: string | null
          role?: 'admin' | 'user' | 'viewer'
          initials?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scraping_jobs: {
        Row: {
          id: string
          user_id: string
          category: string
          location: string
          number_of_leads: number
          status: 'processing' | 'completed' | 'ready_for_download' | 'failed'
          task_id: string | null
          download_url: string | null
          details: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          location: string
          number_of_leads: number
          status?: 'processing' | 'completed' | 'ready_for_download' | 'failed'
          task_id?: string | null
          download_url?: string | null
          details: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          location?: string
          number_of_leads?: number
          status?: 'processing' | 'completed' | 'ready_for_download' | 'failed'
          task_id?: string | null
          download_url?: string | null
          details?: string
          created_at?: string
          updated_at?: string
        }
      }
      business_stages: {
        Row: {
          id: string
          user_id: string
          business_id: string
          stage: 'New' | 'Contacted' | 'Engaged' | 'Qualified' | 'Converted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          stage: 'New' | 'Contacted' | 'Engaged' | 'Qualified' | 'Converted'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          stage?: 'New' | 'Contacted' | 'Engaged' | 'Qualified' | 'Converted'
          created_at?: string
          updated_at?: string
        }
      }
      starred_businesses: {
        Row: {
          id: string
          user_id: string
          business_id: string
          business_type: 'directory' | 'google'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          business_type: 'directory' | 'google'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          business_type?: 'directory' | 'google'
          created_at?: string
        }
      }
      email_threads: {
        Row: {
          id: string
          user_id: string
          business_id: string
          subject: string
          emails: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          subject: string
          emails: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          subject?: string
          emails?: any[]
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 