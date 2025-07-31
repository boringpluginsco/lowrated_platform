import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface MobileBlockProps {
  children: React.ReactNode;
}

export default function MobileBlock({ children }: MobileBlockProps) {
  const { isDarkMode } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      // Check for mobile devices
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(navigator.userAgent);
      
      // Also check screen width for tablets in portrait mode
      const isSmallScreen = window.innerWidth < 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
      setIsLoading(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className={`max-w-md w-full text-center p-8 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {/* Icon */}
          <div className="mb-6">
            <svg
              className={`mx-auto h-16 w-16 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-300'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Desktop Access Required
          </h1>

          {/* Message */}
          <p className={`text-lg mb-6 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            This application is optimized for desktop and tablet use. Please access it from a computer or tablet for the best experience.
          </p>

          {/* Features List */}
          <div className={`text-left mb-6 p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <h3 className={`font-semibold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Features available on desktop:
            </h3>
            <ul className={`space-y-2 text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Full email inbox management
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Business communication tools
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Advanced analytics dashboard
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Drag-and-drop functionality
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>Need help? Contact support at</p>
            <p className="font-mono">support@galleongroup.co</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 