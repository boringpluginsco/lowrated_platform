import { useState, useEffect, useCallback, useRef } from 'react'
import { DatabaseService } from '../services/databaseService'
import { useAuth } from '../context/AuthContext'

export function useDatabase() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const databaseServiceRef = useRef<DatabaseService | null>(null)
  const subscriptionRef = useRef<any>(null)

  // Initialize database service when user changes
  useEffect(() => {
    if (user?.id) {
      databaseServiceRef.current = new DatabaseService(user.id)
      setIsLoading(false)
      setError(null)
    } else {
      databaseServiceRef.current = null
      setIsLoading(true)
    }
  }, [user?.id])

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  const getDatabaseService = useCallback(() => {
    if (!databaseServiceRef.current) {
      throw new Error('Database service not initialized. User may not be authenticated.')
    }
    return databaseServiceRef.current
  }, [])

  const handleError = useCallback((error: any) => {
    console.error('Database operation failed:', error)
    setError(error.message || 'An error occurred')
  }, [])

  return {
    isLoading,
    error,
    getDatabaseService,
    handleError,
    clearError: () => setError(null)
  }
}

// Hook for scraping jobs with real-time updates
export function useScrapingJobs() {
  const { getDatabaseService, handleError } = useDatabase()
  const [scrapingJobs, setScrapingJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    const loadScrapingJobs = async () => {
      try {
        const service = getDatabaseService()
        const jobs = await service.getScrapingJobs()
        setScrapingJobs(jobs)
      } catch (error) {
        handleError(error)
      } finally {
        setIsLoading(false)
      }
    }

    loadScrapingJobs()
  }, [getDatabaseService, handleError])

  // Set up real-time subscription
  useEffect(() => {
    const service = getDatabaseService()
    if (!service) return

    const subscription = service.subscribeToScrapingJobs((payload) => {
      if (payload.eventType === 'INSERT') {
        setScrapingJobs(prev => [payload.new, ...prev])
      } else if (payload.eventType === 'UPDATE') {
        setScrapingJobs(prev => 
          prev.map(job => 
            job.id === payload.new.id ? payload.new : job
          )
        )
      } else if (payload.eventType === 'DELETE') {
        setScrapingJobs(prev => 
          prev.filter(job => job.id !== payload.old.id)
        )
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [getDatabaseService])

  const createScrapingJob = useCallback(async (jobData: any) => {
    try {
      const service = getDatabaseService()
      const newJob = await service.createScrapingJob(jobData)
      return newJob
    } catch (error) {
      handleError(error)
      throw error
    }
  }, [getDatabaseService, handleError])

  const updateScrapingJob = useCallback(async (id: string, updates: any) => {
    try {
      const service = getDatabaseService()
      const updatedJob = await service.updateScrapingJob(id, updates)
      return updatedJob
    } catch (error) {
      handleError(error)
      throw error
    }
  }, [getDatabaseService, handleError])

  const deleteScrapingJob = useCallback(async (id: string) => {
    try {
      const service = getDatabaseService()
      await service.deleteScrapingJob(id)
    } catch (error) {
      handleError(error)
      throw error
    }
  }, [getDatabaseService, handleError])

  return {
    scrapingJobs,
    isLoading,
    createScrapingJob,
    updateScrapingJob,
    deleteScrapingJob
  }
}

// Hook for business stages with real-time updates
export function useBusinessStages() {
  const { getDatabaseService, handleError } = useDatabase()
  const [businessStages, setBusinessStages] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    const loadBusinessStages = async () => {
      try {
        const service = getDatabaseService()
        const stages = await service.getBusinessStages()
        setBusinessStages(stages)
      } catch (error) {
        handleError(error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBusinessStages()
  }, [getDatabaseService, handleError])

  // Set up real-time subscription
  useEffect(() => {
    const service = getDatabaseService()
    if (!service) return

    const subscription = service.subscribeToBusinessStages((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        setBusinessStages(prev => ({
          ...prev,
          [payload.new.business_id]: payload.new.stage
        }))
      } else if (payload.eventType === 'DELETE') {
        setBusinessStages(prev => {
          const newStages = { ...prev }
          delete newStages[payload.old.business_id]
          return newStages
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [getDatabaseService])

  const updateBusinessStage = useCallback(async (businessId: string, stage: "New" | "Contacted" | "Engaged" | "Qualified" | "Converted") => {
    try {
      const service = getDatabaseService()
      await service.updateBusinessStage(businessId, stage)
    } catch (error) {
      handleError(error)
      throw error
    }
  }, [getDatabaseService, handleError])

  return {
    businessStages,
    isLoading,
    updateBusinessStage
  }
} 