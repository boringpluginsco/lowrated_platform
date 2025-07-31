import { Link, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";

export default function Layout({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown and menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const NavLink = ({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) => {
    const isActive = pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-2 font-mono text-lg transition-colors ${
          isActive 
            ? (isDarkMode 
                ? 'bg-[#132532] text-accent shadow-glow-border' 
                : 'bg-blue-100 text-blue-600 shadow-sm')
            : (isDarkMode 
                ? 'text-accent hover:bg-[#1a1d2b] hover:text-accent' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600')
        }`}
      >
        <span className={isActive ? 'text-accent' : (isDarkMode ? 'text-accent' : 'text-gray-600')}>{icon}</span>
        <span className={isActive ? (isDarkMode ? 'text-[#2DF1B0]' : 'text-blue-600') : ''}>{label}</span>
      </Link>
    );
  };

  return (
    <div className={`min-h-screen font-mono ${isDarkMode ? 'bg-background' : 'bg-white'}`}>
      {/* Top Navigation Bar - Only show for authenticated users */}
      {isAuthenticated && (
        <header className={`w-full border-b px-6 py-3 flex items-center justify-between ${
          isDarkMode 
            ? 'bg-[#0D1125] border-gray-600' 
            : 'bg-white border-gray-300'
        }`}>
        <div className="flex items-center gap-4">
          <button className={`hover:text-accent ${isDarkMode ? 'text-text-secondary' : 'text-gray-600'}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/>
            </svg>
          </button>
          <span className={`font-mono text-sm ${isDarkMode ? 'text-text-primary' : 'text-gray-900'}`}>B2B Business Listings</span>
        </div>
        <div className="flex items-center gap-4">
          <button className={`hover:text-accent ${isDarkMode ? 'text-text-secondary' : 'text-gray-600'}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <button className={`hover:text-accent ${isDarkMode ? 'text-text-secondary' : 'text-gray-600'}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>
          <div className="relative" ref={dropdownRef}>
            <button 
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                isDarkMode 
                  ? 'bg-gray-600 text-text-primary hover:bg-gray-500' 
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="User menu"
            >
              {user?.initials || 'NW'}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-48 border rounded-md shadow-lg z-50 ${
                isDarkMode 
                  ? 'bg-[#0D1125] border-gray-600' 
                  : 'bg-white border-gray-300'
              }`}>
                <div className="py-1">
                  <div className={`px-4 py-2 text-sm border-b ${
                    isDarkMode 
                      ? 'text-text-secondary border-gray-600' 
                      : 'text-gray-500 border-gray-200'
                  }`}>
                    <div className={`font-medium ${isDarkMode ? 'text-text-primary' : 'text-gray-900'}`}>{user?.name}</div>
                    <div className="text-xs">{user?.email}</div>
                    <div className="text-xs capitalize">{user?.role} Account</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                      isDarkMode 
                        ? 'text-text-primary hover:bg-[#181B26] hover:text-accent' 
                        : 'text-gray-900 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      )}
      
      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-64 flex flex-col border-r rounded-none shadow-glow-border ${
          isDarkMode 
            ? 'bg-[0D1125] border-gray-600' 
            : 'bg-gray-50 border-gray-300'
        } ${isAuthenticated ? 'h-[calc(100vh-60px)]' : 'h-screen'}`}>
          <div>
            {/* Navigation */}
            <nav className="flex flex-col gap-2 mt-8">
              <NavLink to="/dashboard" label="Dashboard" icon={<svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} />
              <NavLink to="/" label="Trust Pilot" icon={<svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9l1.5 9a2 2 0 002 2h11a2 2 0 002-2L21 9"/><path d="M5 9V7a7 7 0 0114 0v2"/><path d="M9 13h6"/></svg>} />
              <NavLink to="/google" label="Google" icon={<svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>} />
              <NavLink to="/messages" label="Messages" icon={<svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19h16M4 5h16M4 12h16"/><circle cx="19" cy="19" r="2"/></svg>} />
              <NavLink to="/email-inbox" label="Email Inbox" icon={<svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>} />
            </nav>
          </div>
          {/* Bottom section: Analytics, Login and Menu */}
          <div className="mt-auto">
            {/* Analytics Link */}
            <div className="px-6 pb-2">
              <NavLink to="/analytics" label="Analytics" icon={<svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>} />
            </div>
            
            {!isAuthenticated && (
              <div className="px-6 pb-2">
                <NavLink to="/login" label="Login" icon={<svg width="22" height="22" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1"/></svg>} />
              </div>
            )}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-full px-6 py-4 flex items-center justify-between text-sm border-t transition-colors ${
                  isDarkMode 
                    ? 'text-text-secondary border-gray-600 hover:bg-[#181B26] hover:text-accent' 
                    : 'text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg width="18" height="18" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
                  Menu
                </span>
                <svg width="18" height="18" fill="none" stroke="#2DF1B0" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><circle cx="12" cy="16" r="1"/></svg>
              </button>

              {/* Menu Submenu */}
              {isMenuOpen && (
                <div className={`absolute bottom-full left-0 right-0 mb-2 border rounded-md shadow-lg z-50 ${
                  isDarkMode 
                    ? 'bg-[#0D1125] border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}>
                  <div className="py-2">
                    <button className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      isDarkMode 
                        ? 'text-text-primary hover:bg-[#181B26] hover:text-accent' 
                        : 'text-gray-900 hover:bg-gray-100 hover:text-blue-600'
                    }`}>
                      Need help?
                    </button>
                    <button className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      isDarkMode 
                        ? 'text-text-primary hover:bg-[#181B26] hover:text-accent' 
                        : 'text-gray-900 hover:bg-gray-100 hover:text-blue-600'
                    }`}>
                      Submit feedback
                    </button>
                    <button className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      isDarkMode 
                        ? 'text-text-primary hover:bg-[#181B26] hover:text-accent' 
                        : 'text-gray-900 hover:bg-gray-100 hover:text-blue-600'
                    }`}>
                      Become a partner
                    </button>
                    <div className={`px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                      isDarkMode 
                        ? 'text-text-primary hover:bg-[#181B26] hover:text-accent' 
                        : 'text-gray-900 hover:bg-gray-100 hover:text-blue-600'
                    }`}>
                      <span>What's new</span>
                      <span className={`text-xs ${isDarkMode ? 'text-text-secondary' : 'text-gray-500'}`}>05/31</span>
                    </div>
                    {/* Theme Toggle */}
                    <div className={`px-4 py-2 border-t mt-1 pt-3 ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <div className={`flex items-center justify-between text-sm ${
                        isDarkMode ? 'text-text-primary' : 'text-gray-900'
                      }`}>
                        <span className="flex items-center gap-2">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            {isDarkMode ? (
                              // Moon icon for dark mode
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            ) : (
                              // Sun icon for light mode
                              <>
                                <circle cx="12" cy="12" r="5"/>
                                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                              </>
                            )}
                          </svg>
                          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        <button
                          onClick={toggleTheme}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                            isDarkMode 
                              ? 'bg-accent focus:ring-offset-gray-800' 
                              : 'bg-gray-400 focus:ring-offset-white'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              isDarkMode ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
        {/* Main content */}
        <main className={`flex-1 overflow-auto ${
          isDarkMode 
            ? 'bg-background text-text-primary' 
            : 'bg-white text-gray-900'
        } ${isAuthenticated ? 'h-[calc(100vh-60px)]' : 'h-screen'}`}>{children}</main>
      </div>
    </div>
  );
}
