# Supabase Integration Setup Guide

This guide will help you set up Supabase as the database backend for your B2B Business Listings application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `b2b-business-listings`
   - Database Password: Choose a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## 3. Set Up Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:3001
```

## 4. Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL commands
4. This will create all necessary tables and security policies

## 5. Configure Authentication

The application now uses Supabase Auth for user management:

1. **Enable Email Authentication:**
   - Go to Authentication → Settings in Supabase dashboard
   - Enable "Email" provider
   - Configure email templates (optional)

2. **Set up Email Confirmation (Optional):**
   - In Authentication → Settings → Email Templates
   - Customize the confirmation email template
   - Set redirect URLs to your domain

3. **Configure Site URL:**
   - In Authentication → Settings → URL Configuration
   - Set your site URL (e.g., `http://localhost:5173` for development)
   - Add redirect URLs for password reset

4. **Test Authentication:**
   - Try creating a new account at `/signup`
   - Test login/logout functionality
   - Verify user profiles are created automatically

## 6. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the Dashboard page
3. Try creating a new scraping job
4. Verify that data persists after page refresh

## 7. Real-time Features

The application now includes real-time updates for:
- Scraping jobs status changes
- Business stage updates
- New scraping jobs being created

## Database Tables

### scraping_jobs
Stores all Google Maps scraping jobs with their status and results.

### business_stages
Tracks the pipeline stage for each business (New, Contacted, Engaged, etc.).

### starred_businesses
Stores user's starred/favorited businesses.

### email_threads
Stores email conversation threads with businesses.

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic user_id assignment**: All data is automatically associated with the authenticated user
- **Input validation**: Database constraints ensure data integrity

## Migration from localStorage

The application now automatically migrates from localStorage to Supabase:
- Business stages are loaded from the database
- Scraping jobs are stored persistently
- All data syncs across devices

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure your `.env` file has the correct Supabase URL and key
   - Restart your development server after adding environment variables

2. **"Database service not initialized"**
   - Make sure you're logged in to the application
   - Check that the user object has an `id` field

3. **"Permission denied"**
   - Verify that Row Level Security policies are set up correctly
   - Check that the user is properly authenticated

4. **Real-time updates not working**
   - Ensure your Supabase project has real-time enabled
   - Check browser console for connection errors

### Debug Mode

To enable debug logging, add this to your `.env`:

```env
VITE_DEBUG=true
```

## Performance Considerations

- Database queries are optimized with proper indexes
- Real-time subscriptions are automatically cleaned up
- Large datasets are paginated where appropriate

## Backup and Recovery

- Supabase automatically backs up your database
- You can export data using the Supabase dashboard
- Consider setting up additional backup strategies for production

## Production Deployment

When deploying to production:

1. Create a production Supabase project
2. Update environment variables with production credentials
3. Run the schema setup on the production database
4. Test all functionality in the production environment

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com) 