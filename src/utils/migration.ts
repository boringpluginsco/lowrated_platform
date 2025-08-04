import { DatabaseService } from '../services/databaseService'
import { 
  loadBusinessStages, 
  loadStarredBusinesses, 
  loadStarredGoogleBusinesses,
  loadEmailThreads 
} from './persistence'

export class MigrationService {
  private databaseService: DatabaseService

  constructor(userId: string) {
    this.databaseService = new DatabaseService(userId)
  }

  async migrateFromLocalStorage(): Promise<{
    businessStages: number
    starredBusinesses: number
    starredGoogleBusinesses: number
    emailThreads: number
  }> {
    const results = {
      businessStages: 0,
      starredBusinesses: 0,
      starredGoogleBusinesses: 0,
      emailThreads: 0
    }

    try {
      // Migrate business stages
      const localStages = loadBusinessStages()
      for (const [businessId, stage] of Object.entries(localStages)) {
        await this.databaseService.updateBusinessStage(businessId, stage as "New" | "Contacted" | "Engaged" | "Qualified" | "Converted")
        results.businessStages++
      }

      // Migrate starred businesses
      const localStarred = loadStarredBusinesses()
      for (const businessId of localStarred) {
        await this.databaseService.toggleStarredBusiness(businessId, 'directory')
        results.starredBusinesses++
      }

      // Migrate starred Google businesses
      const localGoogleStarred = loadStarredGoogleBusinesses()
      for (const businessId of localGoogleStarred) {
        await this.databaseService.toggleStarredBusiness(businessId, 'google')
        results.starredGoogleBusinesses++
      }

      // Migrate email threads
      const localThreads = loadEmailThreads()
      for (const thread of localThreads) {
        await this.databaseService.saveEmailThread({
          business_id: thread.businessId,
          subject: thread.subject || 'Email Thread',
          emails: thread.emails || []
        })
        results.emailThreads++
      }

      console.log('✅ Migration completed successfully:', results)
      return results
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  async checkMigrationStatus(): Promise<{
    hasLocalData: boolean
    localDataCount: {
      businessStages: number
      starredBusinesses: number
      starredGoogleBusinesses: number
      emailThreads: number
    }
  }> {
    const localStages = loadBusinessStages()
    const localStarred = loadStarredBusinesses()
    const localGoogleStarred = loadStarredGoogleBusinesses()
    const localThreads = loadEmailThreads()

    const localDataCount = {
      businessStages: Object.keys(localStages).length,
      starredBusinesses: localStarred.length,
      starredGoogleBusinesses: localGoogleStarred.length,
      emailThreads: localThreads.length
    }

    const hasLocalData = Object.values(localDataCount).some(count => count > 0)

    return {
      hasLocalData,
      localDataCount
    }
  }

  async clearLocalStorageAfterMigration(): Promise<void> {
    try {
      // Clear all localStorage data after successful migration
      localStorage.removeItem('b2b_business_stages')
      localStorage.removeItem('b2b_starred_businesses')
      localStorage.removeItem('b2b_google_starred_businesses')
      localStorage.removeItem('b2b_email_threads')
      localStorage.removeItem('b2b_messages_by_business')
      
      console.log('✅ LocalStorage cleared after migration')
    } catch (error) {
      console.error('❌ Failed to clear localStorage:', error)
      throw error
    }
  }
} 