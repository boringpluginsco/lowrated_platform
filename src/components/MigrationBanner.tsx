import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { MigrationService } from '../utils/migration'
import { useTheme } from '../context/ThemeContext'

export function MigrationBanner() {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const [showBanner, setShowBanner] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<any>(null)
  const [hasMigrated, setHasMigrated] = useState(false)

  useEffect(() => {
    if (user?.id) {
      checkMigrationStatus()
    }
  }, [user?.id])

  const checkMigrationStatus = async () => {
    try {
      const migrationService = new MigrationService(user!.id)
      const status = await migrationService.checkMigrationStatus()
      
      if (status.hasLocalData) {
        setShowBanner(true)
        setMigrationStatus(status)
      }
    } catch (error) {
      console.error('Error checking migration status:', error)
    }
  }

  const handleMigration = async () => {
    if (!user?.id) return

    setIsMigrating(true)
    try {
      const migrationService = new MigrationService(user.id)
      const results = await migrationService.migrateFromLocalStorage()
      
      // Clear localStorage after successful migration
      await migrationService.clearLocalStorageAfterMigration()
      
      setHasMigrated(true)
      setShowBanner(false)
      
      // Show success message
      alert(`Migration completed successfully!\n\nMigrated:\n- ${results.businessStages} business stages\n- ${results.starredBusinesses} starred businesses\n- ${results.starredGoogleBusinesses} starred Google businesses\n- ${results.emailThreads} email threads`)
      
      // Reload the page to reflect the migrated data
      window.location.reload()
    } catch (error) {
      console.error('Migration failed:', error)
      alert('Migration failed. Please try again or contact support.')
    } finally {
      setIsMigrating(false)
    }
  }

  const dismissBanner = () => {
    setShowBanner(false)
  }

  if (!showBanner || hasMigrated) {
    return null
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-4 ${
      isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-600 text-white'
    }`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-blue-800' : 'bg-blue-500'
          }`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Data Migration Available</h3>
            <p className="text-sm opacity-90">
              We found {migrationStatus?.localDataCount.businessStages || 0} business stages,{' '}
              {migrationStatus?.localDataCount.starredBusinesses || 0} starred businesses, and{' '}
              {migrationStatus?.localDataCount.emailThreads || 0} email threads in your browser storage.
              Migrate them to the cloud for better persistence and cross-device sync.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isMigrating
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700'
            } ${
              isDarkMode ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-700'
            }`}
          >
            {isMigrating ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Migrating...</span>
              </div>
            ) : (
              'Migrate Now'
            )}
          </button>
          
          <button
            onClick={dismissBanner}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 