import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { AuthContextType, User, LoginCredentials, SignUpCredentials } from '../types/auth';
import { supabaseAuthService, type SupabaseUser } from '../services/supabaseAuthService';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const authListenerRef = useRef<any>(null);

  // Convert SupabaseUser to User type
  const convertSupabaseUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.full_name || supabaseUser.email,
    company: supabaseUser.company || '',
    role: supabaseUser.role,
    initials: supabaseUser.initials || supabaseUser.email.substring(0, 2).toUpperCase(),
    avatar: supabaseUser.avatar_url || undefined
  });

  // Check for existing session and set up auth state listener
  useEffect(() => {
    console.log('🔐 AuthContext: useEffect triggered - setting up auth state management');
    let isMounted = true;
    
    const checkUser = async () => {
      console.log('🔐 AuthContext: Checking for existing session');
      try {
        const { user: supabaseUser, error } = await supabaseAuthService.getCurrentUser();
        console.log('🔐 AuthContext: getCurrentUser result:', { user: supabaseUser, error });
        
        if (isMounted) {
          if (supabaseUser && !error) {
            const convertedUser = convertSupabaseUser(supabaseUser);
            console.log('🔐 AuthContext: Setting user from session:', convertedUser);
            setUser(convertedUser);
            setIsAuthenticated(true);
          } else {
            console.log('🔐 AuthContext: No existing session found');
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ AuthContext: Error checking user session:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener (only once)
    if (!authListenerRef.current) {
      console.log('🔐 AuthContext: Setting up auth state listener');
      const authStateChange = supabaseAuthService.onAuthStateChange((supabaseUser) => {
        console.log('🔐 AuthContext: Auth state change received:', supabaseUser ? 'user' : 'null');
        if (isMounted) {
          if (supabaseUser) {
            const convertedUser = convertSupabaseUser(supabaseUser);
            setUser(convertedUser);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
          setIsLoading(false);
        }
      });
      authListenerRef.current = authStateChange.data.subscription;
    }

    // Check for existing session
    checkUser();

    return () => {
      isMounted = false;
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
      }
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    console.log('🔐 AuthContext: Starting login process');
    setIsLoading(true);
    try {
      const { user: supabaseUser, error } = await supabaseAuthService.signIn(credentials);
      console.log('🔐 AuthContext: SignIn result:', { user: supabaseUser, error });
      
      if (supabaseUser && !error) {
        const convertedUser = convertSupabaseUser(supabaseUser);
        console.log('🔐 AuthContext: Converting user:', convertedUser);
        setUser(convertedUser);
        setIsAuthenticated(true);
        console.log('🔐 AuthContext: Login successful');
        return true;
      }
      
      // Provide specific error messages
      if (error?.includes('Email not confirmed')) {
        console.error('❌ AuthContext: Email not confirmed error');
        // You could set a global error state here if needed
      } else {
        console.error('❌ AuthContext: Login error:', error);
      }
      
      return false;
    } catch (error) {
      console.error('❌ AuthContext: Login catch error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (credentials: SignUpCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: supabaseUser, error } = await supabaseAuthService.signUp(credentials);
      if (supabaseUser && !error) {
        const convertedUser = convertSupabaseUser(supabaseUser);
        setUser(convertedUser);
        setIsAuthenticated(true);
        return true;
      }
      console.error('Sign up error:', error);
      return false;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('🔐 AuthContext: Starting logout process');
    try {
      const result = await supabaseAuthService.signOut();
      console.log('🔐 AuthContext: SignOut result:', result);
      setUser(null);
      setIsAuthenticated(false);
      console.log('🔐 AuthContext: Logout successful');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      const supabaseUpdates = {
        full_name: updates.name,
        company: updates.company,
        role: updates.role,
        initials: updates.initials,
        avatar_url: updates.avatar
      };

      const { user: supabaseUser, error } = await supabaseAuthService.updateProfile(supabaseUpdates);
      if (supabaseUser && !error) {
        const convertedUser = convertSupabaseUser(supabaseUser);
        setUser(convertedUser);
        return true;
      }
      console.error('Profile update error:', error);
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabaseAuthService.resetPassword(email);
      if (!error) {
        return true;
      }
      console.error('Password reset error:', error);
      return false;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signUp,
    logout,
    updateProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 