import { useState, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { loadEmailThreads } from "../utils/persistence";

export default function AnalyticsPage() {
  const { isDarkMode } = useTheme();

  // Function to calculate total contacted people
  const calculateContactedCount = useMemo(() => {
    try {
      const emailThreads = loadEmailThreads();
      
      // Count businesses that have at least 1 sent email
      const contactedBusinesses = emailThreads.filter(thread => {
        // Check if this business has at least 1 sent email
        return thread.emails.some((email: { direction: string }) => email.direction === 'sent');
      });
      
      return contactedBusinesses.length;
    } catch (error) {
      console.error('Error calculating contacted count:', error);
      return 0;
    }
  }, []);

  return (
    <section className={`w-full min-h-screen py-6 px-6 font-mono ${
      isDarkMode ? 'bg-background text-text-primary' : 'bg-white text-gray-900'
    }`}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-bold mb-4 ${
          isDarkMode ? 'text-text-primary' : 'text-gray-900'
        }`}>
          Analytics
        </h1>
        <p className={`text-sm ${
          isDarkMode ? 'text-text-secondary' : 'text-gray-600'
        }`}>
          Track your business outreach performance and insights
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {/* CONTACTED Card */}
        <div className={`p-6 rounded-lg border ${
          isDarkMode 
            ? 'bg-[#181B26] border-gray-600' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${
              isDarkMode ? 'text-accent' : 'text-blue-600'
            }`}>
              CONTACTED
            </h3>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
            }`}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>
          
          <div className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-text-primary' : 'text-gray-900'
          }`}>
            {calculateContactedCount}
          </div>
          
          <p className={`text-xs ${
            isDarkMode ? 'text-text-secondary' : 'text-gray-600'
          }`}>
            Total people contacted with at least 1 email sent
          </p>
        </div>

        {/* OPENED Card */}
        <div className={`p-6 rounded-lg border ${
          isDarkMode 
            ? 'bg-[#181B26] border-gray-600' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${
              isDarkMode ? 'text-accent' : 'text-green-600'
            }`}>
              OPENED
            </h3>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
            }`}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
          </div>
          
          <div className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-text-primary' : 'text-gray-900'
          }`}>
            {Math.round(calculateContactedCount * 0.1)}
          </div>
          
          <p className={`text-xs ${
            isDarkMode ? 'text-text-secondary' : 'text-gray-600'
          }`}>
            Emails opened (10% of contacted)
          </p>
        </div>

        {/* REPLIED Card */}
        <div className={`p-6 rounded-lg border ${
          isDarkMode 
            ? 'bg-[#181B26] border-gray-600' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${
              isDarkMode ? 'text-accent' : 'text-purple-600'
            }`}>
              REPLIED
            </h3>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'
            }`}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={isDarkMode ? 'text-purple-400' : 'text-purple-600'}>
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
              </svg>
            </div>
          </div>
          
          <div className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-text-primary' : 'text-gray-900'
          }`}>
            {Math.round(calculateContactedCount * 0.05)}
          </div>
          
          <p className={`text-xs ${
            isDarkMode ? 'text-text-secondary' : 'text-gray-600'
          }`}>
            Emails replied to (50% of opened)
          </p>
        </div>

        {/* POSITIVE Card */}
        <div className={`p-6 rounded-lg border ${
          isDarkMode 
            ? 'bg-[#181B26] border-gray-600' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${
              isDarkMode ? 'text-accent' : 'text-orange-600'
            }`}>
              POSITIVE
            </h3>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-orange-600/20' : 'bg-orange-100'
            }`}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}>
                <path d="M14 9V5a3 3 0 0 0-6 0v4"/>
                <rect x="2" y="9" width="20" height="12" rx="2" ry="2"/>
              </svg>
            </div>
          </div>
          
          <div className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-text-primary' : 'text-gray-900'
          }`}>
            0
          </div>
          
          <p className={`text-xs ${
            isDarkMode ? 'text-text-secondary' : 'text-gray-600'
          }`}>
            Positive reply rate
          </p>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className={`p-6 rounded-lg border mb-8 ${
        isDarkMode 
          ? 'bg-[#181B26] border-gray-600' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-text-primary' : 'text-gray-900'
          }`}>
            Analytics
          </h3>
          <select className={`px-3 py-1 rounded border text-sm ${
            isDarkMode 
              ? 'bg-[#101322] border-gray-600 text-text-primary' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}>
            <option>Last Year</option>
            <option>Last 6 Months</option>
            <option>Last 3 Months</option>
            <option>Last Month</option>
          </select>
        </div>

        {/* Stacked Area Chart */}
        <div className="h-80 relative w-full">
          <svg className="w-full h-full" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="80" height="32" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 32" fill="none" stroke={isDarkMode ? "#374151" : "#e5e7eb"} strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Y-axis */}
            <line x1="60" y1="20" x2="60" y2="280" stroke={isDarkMode ? "#6b7280" : "#9ca3af"} strokeWidth="1"/>
            {/* X-axis */}
            <line x1="60" y1="280" x2="740" y2="280" stroke={isDarkMode ? "#6b7280" : "#9ca3af"} strokeWidth="1"/>
            
            {/* Y-axis labels */}
            <text x="55" y="25" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="end">90</text>
            <text x="55" y="75" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="end">70</text>
            <text x="55" y="125" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="end">50</text>
            <text x="55" y="175" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="end">30</text>
            <text x="55" y="225" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="end">10</text>
            <text x="55" y="275" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="end">0</text>
            
            {/* X-axis labels (months) */}
            <text x="100" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Jan</text>
            <text x="160" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Feb</text>
            <text x="220" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Mar</text>
            <text x="280" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Apr</text>
            <text x="340" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">May</text>
            <text x="400" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Jun</text>
            <text x="460" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Jul</text>
            <text x="520" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Aug</text>
            <text x="580" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Sep</text>
            <text x="640" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Oct</text>
            <text x="700" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Nov</text>
            <text x="760" y="295" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10" textAnchor="middle">Dec</text>
            
            {/* Smooth data with peaks and valleys - Contacted varies from 40-50 */}
            {/* Positive (Orange) - Base layer - 5% of replied */}
            <path
              d="M60,280 Q80,278 100,276 T140,275 T180,274 T220,273 T260,272 T300,271 T340,270 T380,269 T420,268 T460,267 T500,266 T540,265 T580,264 T620,263 T660,262 T700,261 T740,260 L740,280 Z"
              fill="#f97316"
              opacity="0.9"
            />
            
            {/* Replied (Purple) - Second layer - 50% of opened */}
            <path
              d="M60,280 Q80,270 100,268 T140,266 T180,264 T220,262 T260,260 T300,258 T340,256 T380,254 T420,252 T460,250 T500,248 T540,246 T580,244 T620,242 T660,240 T700,238 T740,236 L740,280 Z"
              fill="#a855f7"
              opacity="0.9"
            />
            
            {/* Opened (Green) - Third layer - 10% of contacted */}
            <path
              d="M60,280 Q80,250 100,248 T140,246 T180,244 T220,242 T260,240 T300,238 T340,236 T380,234 T420,232 T460,230 T500,228 T540,226 T580,224 T620,222 T660,220 T700,218 T740,216 L740,280 Z"
              fill="#22c55e"
              opacity="0.9"
            />
            
            {/* Contacted (Blue) - Top layer - varies from 40-50 with peaks and valleys */}
            <path
              d="M60,280 Q80,200 100,195 T140,190 T180,185 T220,180 T260,175 T300,170 T340,165 T380,160 T420,155 T460,150 T500,145 T540,140 T580,135 T620,130 T660,125 T700,120 T740,115 L740,280 Z"
              fill="#3b82f6"
              opacity="0.9"
            />
            
            {/* Legend */}
            <rect x="650" y="20" width="12" height="8" fill="#3b82f6"/>
            <text x="668" y="27" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10">Contacted</text>
            <rect x="650" y="35" width="12" height="8" fill="#22c55e"/>
            <text x="668" y="42" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10">Opened</text>
            <rect x="650" y="50" width="12" height="8" fill="#a855f7"/>
            <text x="668" y="57" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10">Replied</text>
            <rect x="650" y="65" width="12" height="8" fill="#f97316"/>
            <text x="668" y="72" fill={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize="10">Positive</text>
          </svg>
        </div>
      </div>

      {/* Main Content Area - Ready for new content */}
      <div className={`w-full p-8 rounded-lg border ${
        isDarkMode 
          ? 'bg-[#181B26] border-gray-600' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className={`text-center ${
          isDarkMode ? 'text-text-secondary' : 'text-gray-500'
        }`}>
          <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
          <p>Ready for new analytics content and features</p>
        </div>
      </div>
    </section>
  );
} 