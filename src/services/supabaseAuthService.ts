import { supabase } from '../lib/supabase'
import type { LoginCredentials, SignUpCredentials } from '../types/auth'

export interface SupabaseUser {
  id: string
  email: string
  full_name: string | null
  company: string | null
  role: 'admin' | 'user' | 'viewer'
  initials: string | null
  avatar_url: string | null
}

export const supabaseAuthService = {
  // Sign up with email and password
  signUp: async (credentials: SignUpCredentials): Promise<{ user: SupabaseUser | null; error: string | null }> => {
    try {
      console.log('Starting signup process for:', credentials.email);
      console.log('Password length during signup:', credentials.password.length);
      
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
            role: credentials.role || 'user'
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (error) {
        console.error('Supabase auth signup error:', error);
        return { user: null, error: error.message }
      }

      console.log('Auth signup successful, user ID:', data.user?.id);
      console.log('Auth signup session:', data.session);
      console.log('Auth signup user confirmed:', data.user?.email_confirmed_at);

      // If we have a session, the user is already signed in
      if (data.session) {
        console.log('User is already signed in with session');
      }

      if (data.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.log('Profile fetch error, attempting manual creation...');
          
          // Try to create the profile manually using RPC to bypass RLS
          const { data: newProfile, error: createError } = await supabase.rpc('create_user_profile', {
            user_id: data.user.id,
            user_email: data.user.email || credentials.email,
            user_full_name: credentials.fullName,
            user_role: credentials.role || 'user',
            user_initials: credentials.fullName.substring(0, 2).toUpperCase()
          })

          if (createError) {
            console.error('Manual profile creation failed:', createError);
            return { user: null, error: `Failed to create user profile: ${createError.message}` }
          }

          console.log('Manual profile creation successful:', newProfile);
          return { 
            user: newProfile as SupabaseUser, 
            error: null 
          }
        }

        if (!profile) {
          console.log('No profile found, attempting manual creation...');
          
          // Try to create the profile manually using RPC to bypass RLS
          const { data: newProfile, error: createError } = await supabase.rpc('create_user_profile', {
            user_id: data.user.id,
            user_email: data.user.email || credentials.email,
            user_full_name: credentials.fullName,
            user_role: credentials.role || 'user',
            user_initials: credentials.fullName.substring(0, 2).toUpperCase()
          })

          if (createError) {
            console.error('Manual profile creation failed:', createError);
            return { user: null, error: `Failed to create user profile: ${createError.message}` }
          }

          console.log('Manual profile creation successful:', newProfile);
          return { 
            user: newProfile as SupabaseUser, 
            error: null 
          }
        }

        console.log('Profile retrieved successfully:', profile);
        return { 
          user: profile as SupabaseUser, 
          error: null 
        }
      }

      console.error('No user returned from signup');
      return { user: null, error: 'Sign up successful but user not found' }
    } catch (error) {
      console.error('Signup catch error:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error.message : 'An error occurred during sign up' 
      }
    }
  },

  // Sign in with email and password
  signIn: async (credentials: LoginCredentials): Promise<{ user: SupabaseUser | null; error: string | null }> => {
    try {
      console.log('🔐 Starting sign in process for:', credentials.email);
      console.log('🔐 Password length:', credentials.password.length);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        console.error('❌ Supabase auth signin error:', error);
        return { user: null, error: error.message }
      }

      console.log('✅ Auth signin successful, user ID:', data.user?.id);

      if (data.user) {
        // Get the user profile
        console.log('🔍 Fetching user profile for ID:', data.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('❌ Profile fetch error:', profileError);
          return { user: null, error: profileError.message }
        }

        console.log('✅ Profile retrieved successfully:', profile);
        return { 
          user: profile as SupabaseUser, 
          error: null 
        }
      }

      console.error('❌ No user returned from signin');
      return { user: null, error: 'Sign in successful but user not found' }
    } catch (error) {
      console.error('❌ Signin catch error:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error.message : 'An error occurred during sign in' 
      }
    }
  },

  // Sign out
  signOut: async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'An error occurred during sign out' 
      }
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<{ user: SupabaseUser | null; error: string | null }> => {
    try {
      console.log('🔐 Getting current user from Supabase auth');
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.log('🔐 No authenticated user found:', error?.message || 'No user found');
        return { user: null, error: error?.message || 'No user found' }
      }

      console.log('🔐 Found authenticated user:', user.id);

      // Get the user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        // If we can't fetch the profile but the user is authenticated, 
        // create a basic user object from the auth user data
        console.warn('⚠️ Profile fetch failed, creating basic user from auth data');
        return { 
          user: {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email || '',
            company: null,
            role: user.user_metadata?.role || 'user',
            initials: user.user_metadata?.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase() || 'U',
            avatar_url: null
          } as SupabaseUser, 
          error: null 
        }
      }

      console.log('✅ User profile retrieved:', profile);
      return { 
        user: profile as SupabaseUser, 
        error: null 
      }
    } catch (error) {
      console.error('❌ Error in getCurrentUser:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error.message : 'An error occurred getting current user' 
      }
    }
  },

  // Update user profile
  updateProfile: async (updates: Partial<SupabaseUser>): Promise<{ user: SupabaseUser | null; error: string | null }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { user: null, error: 'No authenticated user' }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { user: null, error: error.message }
      }

      return { 
        user: data as SupabaseUser, 
        error: null 
      }
    } catch (error) {
      return { 
        user: null, 
        error: error instanceof Error ? error.message : 'An error occurred updating profile' 
      }
    }
  },

  // Reset password
  resetPassword: async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      return { error: error?.message || null }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'An error occurred resetting password' 
      }
    }
  },

  // Update password
  updatePassword: async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      return { error: error?.message || null }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'An error occurred updating password' 
      }
    }
  },



  // Listen to auth state changes
  onAuthStateChange: (callback: (user: SupabaseUser | null) => void) => {
    console.log('🔐 Setting up auth state change listener');
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change event:', event, 'Session:', session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔐 User signed in, fetching profile for:', session.user.id);
        
        try {
          // Get the user profile
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('❌ Error fetching profile in auth state change:', error);
            // Don't log out the user if profile fetch fails - they might still be authenticated
            // Just log the error and continue
            console.warn('⚠️ Profile fetch failed but user might still be authenticated');
          } else {
            console.log('✅ Profile fetched in auth state change:', profile);
            callback(profile as SupabaseUser);
          }
        } catch (error) {
          console.error('❌ Error in auth state change profile fetch:', error);
          // Don't log out the user if profile fetch fails - they might still be authenticated
          console.warn('⚠️ Profile fetch failed but user might still be authenticated');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 User signed out');
        callback(null);
      } else {
        console.log('🔐 Other auth event:', event);
      }
    })
  }
} 