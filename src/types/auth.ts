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

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
} 