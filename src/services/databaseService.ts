import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type ScrapingJob = Database['public']['Tables']['scraping_jobs']['Row']
type ScrapingJobInsert = Database['public']['Tables']['scraping_jobs']['Insert']
type ScrapingJobUpdate = Database['public']['Tables']['scraping_jobs']['Update']

type BusinessStage = Database['public']['Tables']['business_stages']['Row']
type BusinessStageInsert = Database['public']['Tables']['business_stages']['Insert']

type StarredBusiness = Database['public']['Tables']['starred_businesses']['Row']
type StarredBusinessInsert = Database['public']['Tables']['starred_businesses']['Insert']

type EmailThread = Database['public']['Tables']['email_threads']['Row']
type EmailThreadInsert = Database['public']['Tables']['email_threads']['Insert']

export class DatabaseService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Scraping Jobs
  async getScrapingJobs(): Promise<ScrapingJob[]> {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching scraping jobs:', error)
      throw error
    }

    return data || []
  }

  async createScrapingJob(job: Omit<ScrapingJobInsert, 'user_id'>): Promise<ScrapingJob> {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .insert({ ...job, user_id: this.userId })
      .select()
      .single()

    if (error) {
      console.error('Error creating scraping job:', error)
      throw error
    }

    return data
  }

  async updateScrapingJob(id: string, updates: ScrapingJobUpdate): Promise<ScrapingJob> {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating scraping job:', error)
      throw error
    }

    return data
  }

  async deleteScrapingJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('scraping_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId)

    if (error) {
      console.error('Error deleting scraping job:', error)
      throw error
    }
  }

  // Business Stages
  async getBusinessStages(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('business_stages')
      .select('business_id, stage')
      .eq('user_id', this.userId)

    if (error) {
      console.error('Error fetching business stages:', error)
      throw error
    }

    const stages: Record<string, string> = {}
    data?.forEach(item => {
      stages[item.business_id] = item.stage
    })

    return stages
  }

  async updateBusinessStage(businessId: string, stage: string): Promise<void> {
    // First try to update existing record
    const { data: existing } = await supabase
      .from('business_stages')
      .select('id')
      .eq('user_id', this.userId)
      .eq('business_id', businessId)
      .single()

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('business_stages')
        .update({ 
          stage: stage as any, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating business stage:', error)
        throw error
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from('business_stages')
        .insert({
          user_id: this.userId,
          business_id: businessId,
          stage: stage as any
        })

      if (error) {
        console.error('Error creating business stage:', error)
        throw error
      }
    }
  }

  // Starred Businesses
  async getStarredBusinesses(type: 'directory' | 'google'): Promise<string[]> {
    const { data, error } = await supabase
      .from('starred_businesses')
      .select('business_id')
      .eq('user_id', this.userId)
      .eq('business_type', type)

    if (error) {
      console.error('Error fetching starred businesses:', error)
      throw error
    }

    return data?.map(item => item.business_id) || []
  }

  async toggleStarredBusiness(businessId: string, type: 'directory' | 'google'): Promise<boolean> {
    // Check if already starred
    const { data: existing } = await supabase
      .from('starred_businesses')
      .select('id')
      .eq('user_id', this.userId)
      .eq('business_id', businessId)
      .eq('business_type', type)
      .single()

    if (existing) {
      // Remove star
      const { error } = await supabase
        .from('starred_businesses')
        .delete()
        .eq('id', existing.id)

      if (error) {
        console.error('Error removing starred business:', error)
        throw error
      }

      return false
    } else {
      // Add star
      const { error } = await supabase
        .from('starred_businesses')
        .insert({
          user_id: this.userId,
          business_id: businessId,
          business_type: type
        })

      if (error) {
        console.error('Error adding starred business:', error)
        throw error
      }

      return true
    }
  }

  // Email Threads
  async getEmailThreads(): Promise<EmailThread[]> {
    const { data, error } = await supabase
      .from('email_threads')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching email threads:', error)
      throw error
    }

    return data || []
  }

  async saveEmailThread(thread: Omit<EmailThreadInsert, 'user_id'>): Promise<EmailThread> {
    const { data, error } = await supabase
      .from('email_threads')
      .upsert({ ...thread, user_id: this.userId })
      .select()
      .single()

    if (error) {
      console.error('Error saving email thread:', error)
      throw error
    }

    return data
  }

  // Real-time subscriptions
  subscribeToScrapingJobs(callback: (payload: any) => void) {
    return supabase
      .channel('scraping_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scraping_jobs',
          filter: `user_id=eq.${this.userId}`
        },
        callback
      )
      .subscribe()
  }

  subscribeToBusinessStages(callback: (payload: any) => void) {
    return supabase
      .channel('business_stages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_stages',
          filter: `user_id=eq.${this.userId}`
        },
        callback
      )
      .subscribe()
  }
} 