import { supabase } from '../lib/supabase'

// Define types manually since Database type is not available
interface ScrapingJob {
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

type ScrapingJobInsert = Omit<ScrapingJob, 'id' | 'created_at' | 'updated_at'>
type ScrapingJobUpdate = Partial<Omit<ScrapingJob, 'id' | 'user_id' | 'created_at'>>

interface BusinessStage {
  id: string
  user_id: string
  business_id: string
  stage: string
  created_at: string
  updated_at: string
}

interface EmailThread {
  id: string
  user_id: string
  business_id: string
  subject: string
  emails: any[]
  created_at: string
  updated_at: string
}

type EmailThreadInsert = Omit<EmailThread, 'id' | 'created_at' | 'updated_at'>

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
    data?.forEach((item: any) => {
      stages[item.business_id] = item.stage
    })

    return stages
  }

  async updateBusinessStage(businessId: string, stage: BusinessStage['stage']): Promise<void> {
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
          stage, 
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
          stage
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

    return data?.map((item: any) => item.business_id) || []
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
        .eq('id', (existing as any).id)

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