import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Business } from "../types";
import { useTheme } from "../context/ThemeContext";
import {
  // saveBusinessStages,
  loadBusinessStages,
} from "../utils/persistence";

type BusinessStage = "New" | "Contacted" | "Engaged" | "Qualified" | "Converted";

interface Props {
  businesses: Business[];
}

export default function DashboardPage({ businesses }: Props) {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BusinessStage>("New");
  const [businessStages] = useState<
    Record<string, BusinessStage>
  >(() => {
    // Load persisted stages or initialize as 'New'
    const persistedStages = loadBusinessStages();
    const initialStages: Record<string, BusinessStage> = {};
    businesses.forEach((business) => {
      initialStages[business.id] =
        (persistedStages[business.id] as BusinessStage) || "New";
    });
    return initialStages;
  });

  // Filter businesses based on active tab
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(
      (business) => businessStages[business.id] === activeTab
    );
  }, [businesses, businessStages, activeTab]);

  return (
    <div
      className={`h-[calc(100vh-4rem)] shadow-inner font-mono ${
        isDarkMode ? "bg-background" : "bg-white"
      }`}
    >
      {/* Page Header */}
      <div
        className={`px-6 py-6 border-b ${
          isDarkMode ? "border-gray-600" : "border-gray-300"
        }`}
      >
        <h1
          className={`text-2xl font-bold mb-2 ${
            isDarkMode ? "text-text-primary" : "text-gray-900"
          }`}
        >
          Dashboard
        </h1>
        <p
          className={`text-sm ${
            isDarkMode ? "text-text-secondary" : "text-gray-600"
          }`}
        >
          Overview of your business outreach pipeline
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Pipeline Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {(["New", "Contacted", "Engaged", "Qualified", "Converted"] as BusinessStage[]).map((stage) => {
              const count = businesses.filter((b) => businessStages[b.id] === stage).length;
              const percentage = businesses.length > 0 ? Math.round((count / businesses.length) * 100) : 0;
              
              return (
                <div
                  key={stage}
                  className={`p-6 rounded-lg border ${
                    isDarkMode ? "bg-[#1a1d2b] border-gray-600" : "bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-text-secondary" : "text-gray-600"
                      }`}
                    >
                      {stage}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        isDarkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>
                  <div
                    className={`text-3xl font-bold mb-2 ${
                      isDarkMode ? "text-text-primary" : "text-gray-900"
                    }`}
                  >
                    {count}
                  </div>
                  <div className="mt-4">
                    <div
                      className={`h-3 rounded-full ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          stage === "New" ? "bg-blue-500" :
                          stage === "Contacted" ? "bg-green-500" :
                          stage === "Engaged" ? "bg-yellow-500" :
                          stage === "Qualified" ? "bg-purple-500" :
                          "bg-orange-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stage Filter Tabs */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {(["New", "Contacted", "Engaged", "Qualified", "Converted"] as BusinessStage[]).map((stage) => {
                  const count = businesses.filter((b) => businessStages[b.id] === stage).length;
                  return (
                    <button
                      key={stage}
                      onClick={() => setActiveTab(stage)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === stage
                          ? isDarkMode
                            ? "bg-accent text-background"
                            : "bg-blue-600 text-white"
                          : isDarkMode
                          ? "text-text-secondary hover:text-text-primary hover:bg-[#181B26]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {stage}
                      {count > 0 && (
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            activeTab === stage
                              ? isDarkMode
                                ? "bg-background text-accent"
                                : "bg-white text-blue-600"
                              : isDarkMode
                              ? "bg-gray-600 text-gray-300"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Add New Leads Button */}
              <button
                onClick={() => navigate('/google')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isDarkMode 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add New Leads
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`rounded-lg border mb-8 ${
            isDarkMode ? "bg-[#1a1d2b] border-gray-600" : "bg-white border-gray-200"
          }`}>
            <div className={`px-6 py-4 border-b ${
              isDarkMode ? "border-gray-600" : "border-gray-200"
            }`}>
              <h3
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-text-primary" : "text-gray-900"
                }`}
              >
                Recent Activity - {activeTab} Stage
              </h3>
            </div>
            <div className="p-6">
              {filteredBusinesses.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      isDarkMode ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      className={isDarkMode ? "text-gray-600" : "text-gray-400"}
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-text-secondary" : "text-gray-600"
                    }`}
                  >
                    No businesses in the "{activeTab}" stage yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBusinesses.map((business) => (
                    <div
                      key={business.id}
                      className={`p-4 rounded-lg border ${
                        isDarkMode ? "bg-[#101322] border-gray-600 hover:bg-[#181B26]" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            businessStages[business.id] === "New" ? "bg-blue-500" :
                            businessStages[business.id] === "Contacted" ? "bg-green-500" :
                            businessStages[business.id] === "Engaged" ? "bg-yellow-500" :
                            businessStages[business.id] === "Qualified" ? "bg-purple-500" :
                            "bg-orange-500"
                          }`}
                        >
                          {business.name.charAt(0)}
                        </div>
                        <div>
                          <div
                            className={`font-medium ${
                              isDarkMode ? "text-text-primary" : "text-gray-900"
                            }`}
                          >
                            {business.name}
                          </div>
                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-text-secondary" : "text-gray-600"
                            }`}
                          >
                            {business.city}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            businessStages[business.id] === "New" ? "bg-blue-100 text-blue-800" :
                            businessStages[business.id] === "Contacted" ? "bg-green-100 text-green-800" :
                            businessStages[business.id] === "Engaged" ? "bg-yellow-100 text-yellow-800" :
                            businessStages[business.id] === "Qualified" ? "bg-purple-100 text-purple-800" :
                            "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {businessStages[business.id]}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className={`text-sm ${
                            isDarkMode ? "text-text-secondary" : "text-gray-600"
                          }`}>
                            {business.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-lg border ${
              isDarkMode ? "bg-[#1a1d2b] border-gray-600" : "bg-white border-gray-200"
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isDarkMode ? "bg-blue-600" : "bg-blue-100"
                }`}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={isDarkMode ? "text-blue-400" : "text-blue-600"}>
                    <path d="M9 19V6l7 7-7 7z"/>
                    <path d="M2 12h14"/>
                  </svg>
                </div>
                <h4 className={`text-lg font-semibold ${
                  isDarkMode ? "text-text-primary" : "text-gray-900"
                }`}>
                  MailMerge Campaign
                </h4>
              </div>
              <p className={`text-sm mb-4 ${
                isDarkMode ? "text-text-secondary" : "text-gray-600"
              }`}>
                Send personalized emails to multiple businesses in your pipeline
              </p>
              <button 
                onClick={() => navigate('/messages?mode=mailmerge')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Launch Campaign
              </button>
            </div>

            <div className={`p-6 rounded-lg border ${
              isDarkMode ? "bg-[#1a1d2b] border-gray-600" : "bg-white border-gray-200"
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isDarkMode ? "bg-green-600" : "bg-green-100"
                }`}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={isDarkMode ? "text-green-400" : "text-green-600"}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h4 className={`text-lg font-semibold ${
                  isDarkMode ? "text-text-primary" : "text-gray-900"
                }`}>
                  Compose Email
                </h4>
              </div>
              <p className={`text-sm mb-4 ${
                isDarkMode ? "text-text-secondary" : "text-gray-600"
              }`}>
                Write and send individual emails to specific businesses
              </p>
              <button 
                onClick={() => navigate('/messages?mode=email')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                New Email
              </button>
            </div>

            <div className={`p-6 rounded-lg border ${
              isDarkMode ? "bg-[#1a1d2b] border-gray-600" : "bg-white border-gray-200"
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isDarkMode ? "bg-purple-600" : "bg-purple-100"
                }`}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={isDarkMode ? "text-purple-400" : "text-purple-600"}>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <h4 className={`text-lg font-semibold ${
                  isDarkMode ? "text-text-primary" : "text-gray-900"
                }`}>
                  Start Chat
                </h4>
              </div>
              <p className={`text-sm mb-4 ${
                isDarkMode ? "text-text-secondary" : "text-gray-600"
              }`}>
                Begin a conversation with selected businesses in your pipeline
              </p>
              <button className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}>
                Open Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 