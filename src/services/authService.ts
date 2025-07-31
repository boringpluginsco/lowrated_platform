import type { User, LoginCredentials } from '../types/auth';

// Mock user database
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@demo.com',
    name: 'Demo Admin',
    company: 'Demo Company',
    role: 'admin',
    initials: 'DA'
  },
  {
    id: '2',
    email: 'user@demo.com',
    name: 'Demo User',
    company: 'Demo Company',
    role: 'user',
    initials: 'DU'
  },
  {
    id: '3',
    email: 'viewer@demo.com',
    name: 'Demo Viewer',
    company: 'Demo Company',
    role: 'viewer',
    initials: 'DV'
  }
];

// Mock passwords (in real app, this would be handled by backend)
const MOCK_PASSWORDS: Record<string, string> = {
  'admin@demo.com': 'demo123',
  'user@demo.com': 'demo123',
  'viewer@demo.com': 'demo123'
};

export const authService = {
  // Simulate login API call
  login: async (credentials: LoginCredentials): Promise<User | null> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = MOCK_USERS.find(u => u.email === credentials.email);
    const correctPassword = MOCK_PASSWORDS[credentials.email];
    
    if (user && correctPassword === credentials.password) {
      return user;
    }
    
    return null;
  },

  // Get current user from session storage
  getCurrentUser: (): User | null => {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Save user to session storage
  saveUser: (user: User): void => {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  },

  // Remove user from session storage
  removeUser: (): void => {
    sessionStorage.removeItem('currentUser');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!sessionStorage.getItem('currentUser');
  }
}; 