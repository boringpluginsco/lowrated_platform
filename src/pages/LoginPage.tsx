import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { LoginCredentials } from '../types/auth';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(credentials);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-primary font-mono">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex font-mono">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#0D1125] border-r border-gray-600 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-8 border-b border-gray-600">
          <span className="text-2xl text-accent font-bold">📁</span>
          <span className="text-xl font-bold tracking-wide text-text-primary">B2B Listings</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2 mt-8">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 py-2 text-lg text-accent hover:bg-[#1a1d2b] hover:text-accent transition-colors"
          >
            <svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M3 9l1.5 9a2 2 0 002 2h11a2 2 0 002-2L21 9"/>
              <path d="M5 9V7a7 7 0 0114 0v2"/>
              <path d="M9 13h6"/>
            </svg>
            <span>Trust Pilot</span>
          </Link>
          <Link 
            to="/messages" 
            className="flex items-center gap-3 px-4 py-2 text-lg text-accent hover:bg-[#1a1d2b] hover:text-accent transition-colors"
          >
            <svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M4 19h16M4 5h16M4 12h16"/>
              <circle cx="19" cy="19" r="2"/>
            </svg>
            <span>Messages</span>
          </Link>
        </nav>

        {/* Bottom section */}
        <div className="mt-auto">
          <div className="px-4 py-2 mb-2">
            <div className="flex items-center gap-3 text-lg text-accent bg-[#132532] px-4 py-2 rounded-md">
              <svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1"/>
              </svg>
              <span>Login</span>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center justify-between text-text-secondary text-sm border-t border-gray-600">
            <span className="flex items-center gap-2">
              <svg width="18" height="18" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/>
              </svg>
              Menu
            </span>
            <svg width="18" height="18" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4"/>
              <circle cx="12" cy="16" r="1"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-6">
          {/* Login Card */}
          <div className="bg-[#0D1125] border border-gray-600 rounded-lg p-8 shadow-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl text-accent font-bold">📁</span>
                <h1 className="text-2xl font-bold text-text-primary">Sign in to B2B Listings</h1>
              </div>
              <p className="text-text-secondary text-sm">Access your business directory</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-3 text-sm border border-gray-400 rounded-md bg-[#181B26] text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-3 text-sm border border-gray-400 rounded-md bg-[#181B26] text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-secondary"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="text-error text-sm text-center bg-red-900/20 border border-red-700 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-accent rounded-md hover:bg-success transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Signing in...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-[#181B26] rounded-md border border-gray-600">
              <h3 className="text-sm font-medium text-text-primary mb-2">Demo Credentials:</h3>
              <div className="text-xs text-text-secondary space-y-1">
                        <div><strong>Admin:</strong> admin@demo.com / demo123</div>
        <div><strong>User:</strong> user@demo.com / demo123</div>
        <div><strong>Viewer:</strong> viewer@demo.com / demo123</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 