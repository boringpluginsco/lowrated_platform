export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  initials: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signUp: (credentials: SignUpCredentials) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
} 