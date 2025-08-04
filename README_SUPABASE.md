# Supabase Integration for B2B Business Listings

This document explains the Supabase database integration that has been added to your B2B Business Listings application.

## 🎯 What Problem Does This Solve?

**Before Supabase:**
- Data was stored in localStorage (browser storage)
- Data was lost when users cleared their browser or switched devices
- No real-time updates across multiple browser tabs
- Limited storage capacity
- No data backup or recovery

**After Supabase:**
- ✅ Persistent data storage in the cloud
- ✅ Cross-device synchronization
- ✅ Real-time updates across all connected clients
- ✅ Automatic data backup and recovery
- ✅ Scalable storage with no limits
- ✅ Row-level security for data protection

## 🚀 Key Features Added

### 1. **Persistent Scraping Jobs**
- Scraping jobs are now stored in the database
- Status updates are persisted across page refreshes
- Real-time status updates when jobs complete
- Download URLs are stored and accessible anytime

### 2. **Business Pipeline Management**
- Business stages (New, Contacted, Engaged, etc.) are stored in the database
- Changes sync across all devices in real-time
- No more lost progress when switching devices

### 3. **Starred Businesses**
- Starred/favorited businesses are stored in the cloud
- Sync across all your devices
- Separate tracking for directory and Google businesses

### 4. **Email Threads**
- Email conversations are stored persistently
- Access your email history from any device
- Automatic backup of all communications

### 5. **Real-time Updates**
- Live updates when scraping jobs complete
- Real-time business stage changes
- Instant sync across multiple browser tabs

## 📊 Database Schema

The application uses 4 main tables:

### `scraping_jobs`
```sql
- id: UUID (Primary Key)
- user_id: UUID (User who created the job)
- category: TEXT (Business category)
- location: TEXT (Geographic location)
- number_of_leads: INTEGER (Number of leads requested)
- status: TEXT (processing/completed/ready_for_download/failed)
- task_id: TEXT (External scraping service task ID)
- download_url: TEXT (URL to download results)
- details: TEXT (Human-readable job description)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `business_stages`
```sql
- id: UUID (Primary Key)
- user_id: UUID (User who owns the business)
- business_id: TEXT (Business identifier)
- stage: TEXT (New/Contacted/Engaged/Qualified/Converted)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `starred_businesses`
```sql
- id: UUID (Primary Key)
- user_id: UUID (User who starred the business)
- business_id: TEXT (Business identifier)
- business_type: TEXT (directory/google)
- created_at: TIMESTAMP
```

### `email_threads`
```sql
- id: UUID (Primary Key)
- user_id: UUID (User who owns the thread)
- business_id: TEXT (Business identifier)
- subject: TEXT (Email subject)
- emails: JSONB (Array of email messages)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🔐 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Automatic user_id assignment on all operations
- Database-level security policies

### Data Validation
- Input validation at the database level
- Constraint checks for status values
- Unique constraints to prevent duplicates

## 🔄 Migration from localStorage

The application includes an automatic migration system:

1. **Detection**: Automatically detects existing localStorage data
2. **Migration Banner**: Shows a banner when local data is found
3. **One-click Migration**: Migrates all data with a single click
4. **Verification**: Shows migration results and clears localStorage
5. **Seamless Transition**: No data loss during migration

## 🛠️ Setup Instructions

### 1. Create Supabase Project
```bash
# Go to supabase.com and create a new project
# Copy your project URL and anon key
```

### 2. Set Environment Variables
```bash
# Create .env file in project root
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run Database Schema
```bash
# Copy supabase-schema.sql content
# Run in Supabase SQL Editor
```

### 4. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 5. Start Development
```bash
npm run dev
```

## 📱 Usage Examples

### Creating a Scraping Job
```typescript
const { createScrapingJob } = useScrapingJobs();

const newJob = await createScrapingJob({
  category: "Restaurants",
  location: "New York, NY",
  number_of_leads: 50,
  status: "processing",
  details: "Restaurants, New York, NY, 50"
});
```

### Updating Business Stage
```typescript
const { updateBusinessStage } = useBusinessStages();

await updateBusinessStage("business-123", "Contacted");
```

### Real-time Updates
```typescript
// Automatically handled by the hooks
// Data updates in real-time across all connected clients
```

## 🔧 API Reference

### Database Service
```typescript
import { DatabaseService } from './services/databaseService';

const db = new DatabaseService(userId);

// Scraping Jobs
await db.getScrapingJobs();
await db.createScrapingJob(jobData);
await db.updateScrapingJob(id, updates);
await db.deleteScrapingJob(id);

// Business Stages
await db.getBusinessStages();
await db.updateBusinessStage(businessId, stage);

// Starred Businesses
await db.getStarredBusinesses(type);
await db.toggleStarredBusiness(businessId, type);

// Email Threads
await db.getEmailThreads();
await db.saveEmailThread(threadData);
```

### React Hooks
```typescript
import { useScrapingJobs, useBusinessStages } from './hooks/useDatabase';

// Scraping Jobs Hook
const { 
  scrapingJobs, 
  isLoading, 
  createScrapingJob, 
  updateScrapingJob 
} = useScrapingJobs();

// Business Stages Hook
const { 
  businessStages, 
  isLoading, 
  updateBusinessStage 
} = useBusinessStages();
```

## 🚨 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env` file has correct values
   - Restart development server after adding variables

2. **"Database service not initialized"**
   - Ensure user is logged in
   - Check user object has `id` field

3. **"Permission denied"**
   - Verify RLS policies are set up
   - Check user authentication status

4. **Real-time not working**
   - Ensure Supabase project has real-time enabled
   - Check browser console for connection errors

### Debug Mode
```bash
# Add to .env for detailed logging
VITE_DEBUG=true
```

## 📈 Performance Considerations

- **Indexed Queries**: All queries are optimized with proper indexes
- **Real-time Cleanup**: Subscriptions are automatically cleaned up
- **Pagination**: Large datasets are paginated where appropriate
- **Caching**: React Query provides intelligent caching

## 🔄 Migration Strategy

The application supports gradual migration:

1. **Phase 1**: New data goes to Supabase
2. **Phase 2**: Existing localStorage data is migrated
3. **Phase 3**: localStorage is cleared after successful migration
4. **Phase 4**: Full Supabase integration

## 🎯 Benefits for Users

- **No Data Loss**: Data persists across browser sessions
- **Cross-Device Sync**: Access data from any device
- **Real-time Updates**: Live status updates and notifications
- **Better Performance**: Optimized queries and caching
- **Data Backup**: Automatic cloud backup and recovery

## 🔮 Future Enhancements

- **Supabase Auth**: Replace mock authentication
- **File Storage**: Store downloaded CSV files in Supabase Storage
- **Advanced Analytics**: Database-powered analytics and reporting
- **Team Collaboration**: Multi-user support with role-based access
- **API Integration**: REST API for external integrations

## 📞 Support

For issues related to:
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)
- **Application**: Check the main README.md
- **Migration**: Review the migration logs in browser console

---

**Note**: This integration maintains backward compatibility. Users can continue using the application normally, and the migration happens seamlessly when they're ready. 