import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Business } from "../types";
import { useTheme } from "../context/ThemeContext";
import { useScrapingJobs, useBusinessStages } from "../hooks/useDatabase";
import { getStateOptions, formatLocationForJSON } from "../utils/locationUtils";
import { getCategoryOptions, formatCategoryForJSON } from "../utils/categoryUtils";

type BusinessStage = "New" | "Contacted" | "Engaged" | "Qualified" | "Converted";

interface Props {
  businesses: Business[];
}

export default function DashboardPage({ businesses }: Props) {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BusinessStage>("New");
  
  // Database hooks
  const { businessStages } = useBusinessStages();
  const { 
    scrapingJobs, 
    createScrapingJob, 
    updateScrapingJob 
  } = useScrapingJobs();

  // Google Maps Scraper state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [numberOfLeads, setNumberOfLeads] = useState(3);
  
  // Get state options from zipcodes data
  const stateOptions = useMemo(() => getStateOptions(), []);
  
  // Get category options
  const categoryOptions = useMemo(() => getCategoryOptions(), []);

  // Handle download button click
  const handleDownload = async (result: any) => {
    if (result.status === "ready_for_download" && result.task_id) {
      try {
        console.log("Requesting download URL for taskID:", result.task_id);
        
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/scrape/get-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskID: result.task_id })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Download API response:", data);
          
          // Extract the download URL from the response
          const downloadURL = data.downloadURL || data.downloadUrl || data.url;
          
          if (downloadURL) {
            // Update the job in the database
            await updateScrapingJob(result.id, {
              status: "completed",
              download_url: downloadURL
            });
            
            // Open the download URL in a new tab
            window.open(downloadURL, '_blank');
          } else {
            console.log("No download URL found in response. Available fields:", Object.keys(data));
            alert("Download URL not available yet. Please try again later.");
          }
        } else {
          throw new Error(`Download API request failed with status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error requesting download:", error);
        alert(`Error requesting download: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (result.download_url) {
      // If already has download URL, just open it
      window.open(result.download_url, '_blank');
    }
  };

  // Handle Google Maps scraping
  const handleStartScraping = async () => {
    if (!selectedCategory || !selectedLocation) {
      alert("Please select both a category and location before starting.");
      return;
    }
    
    let createdJob: any | null = null;
    try {
      // Get the display names for the selected location and category
      const selectedState = stateOptions.find(state => state.value === selectedLocation);
      const selectedCategoryOption = categoryOptions.find(cat => cat.value === selectedCategory);
      const displayLocation = selectedState ? selectedState.label : selectedLocation;
      const displayCategory = selectedCategoryOption ? selectedCategoryOption.label : selectedCategory;
      
      // Create new scraping job in database
      createdJob = await createScrapingJob({
        category: selectedCategory,
        location: selectedLocation,
        number_of_leads: numberOfLeads,
        status: "processing",
        details: `${displayCategory}, ${displayLocation}, ${numberOfLeads}`,
        task_id: null,
        download_url: null
      });
      
      // Prepare the API payload with properly formatted location and category
      const formattedLocation = formatLocationForJSON(selectedLocation);
      const formattedCategory = formatCategoryForJSON(selectedCategory);
      const payload = [
        {
          location: formattedLocation,
          category: formattedCategory,
          limit: numberOfLeads
        }
      ];
      
      console.log("Sending API request with payload:", payload);
      
      // Make API call to the scraping service
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/scrape/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Scraping API response:", result);

        const taskId = result.taskId || result.taskID || result.task_id;
        const downloadURL = result.downloadURL || result.downloadUrl || result.download_url || result.url;

        if (taskId && createdJob) {
          await updateScrapingJob(createdJob.id, {
            status: "ready_for_download",
            task_id: taskId
          });
          alert(`Scraping job started successfully! Task ID: ${taskId}. Click the download button when ready.`);
        } else if (downloadURL && createdJob) {
          await updateScrapingJob(createdJob.id, {
            status: "completed",
            download_url: downloadURL
          });
          alert(`Successfully started scraping for ${numberOfLeads} ${displayCategory} businesses in ${displayLocation}`);
        } else {
          // Unexpected response shape
          if (createdJob) await updateScrapingJob(createdJob.id, {
            status: "failed",
            task_id: null,
            download_url: null,
            details: `Unexpected API response without taskId or downloadUrl. Keys: ${Object.keys(result).join(', ')}`
          });
          alert("Scraping API did not return a taskId or downloadUrl. Check logs and n8n workflow.");
        }
      } else {
        if (createdJob) await updateScrapingJob(createdJob.id, {
          status: "failed",
          details: `API request failed with status: ${response.status}`
        });
        throw new Error(`API request failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error calling scraping API:", error);
      try {
        if (createdJob) await updateScrapingJob(createdJob.id, {
          status: "failed",
          details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } catch (e) {
        console.error("Failed to update job status to failed:", e);
      }
      alert(`Error starting scraping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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

          {/* Google Maps Scraper */}
          <div className={`mt-8 p-6 rounded-lg border ${
            isDarkMode ? "bg-[#0f1419] border-gray-600" : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDarkMode ? "bg-orange-600" : "bg-orange-100"
              }`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={isDarkMode ? "text-orange-400" : "text-orange-600"}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${
                  isDarkMode ? "text-text-primary" : "text-gray-900"
                }`}>
                  Google Maps Scraper
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? "text-text-secondary" : "text-gray-600"
                }`}>
                  Find and scrape business leads from Google Maps
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Categories Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-text-primary" : "text-gray-700"
                }`}>
                  Categories
                </label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                    isDarkMode 
                      ? "bg-[#101322] border-gray-600 text-text-primary focus:border-accent focus:ring-accent" 
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Locations Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-text-primary" : "text-gray-700"
                }`}>
                  Locations
                </label>
                <select 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                    isDarkMode 
                      ? "bg-[#101322] border-gray-600 text-text-primary focus:border-accent focus:ring-accent" 
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                >
                  <option value="">Select a location</option>
                  {stateOptions.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Leads Slider */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-text-primary" : "text-gray-700"
                }`}>
                  Number of Leads: <span className="font-normal">{numberOfLeads}</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="3"
                    max="1000"
                    value={numberOfLeads}
                    onChange={(e) => setNumberOfLeads(parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      isDarkMode 
                        ? "bg-gray-700 slider-thumb-dark" 
                        : "bg-gray-200 slider-thumb-light"
                    }`}
                    style={{
                      background: isDarkMode 
                        ? `linear-gradient(to right, #2DF1B0 0%, #2DF1B0 ${(numberOfLeads - 3) / 9.97}%, #374151 ${(numberOfLeads - 3) / 9.97}%, #374151 100%)`
                        : `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(numberOfLeads - 3) / 9.97}%, #E5E7EB ${(numberOfLeads - 3) / 9.97}%, #E5E7EB 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span className={isDarkMode ? "text-text-secondary" : "text-gray-500"}>3</span>
                    <span className={isDarkMode ? "text-text-secondary" : "text-gray-500"}>1000</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleStartScraping}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isDarkMode 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                }`}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Start Scraping
              </button>
            </div>

            {/* Results Table */}
            <div className="mt-8">
              <h4 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-text-primary" : "text-gray-900"
              }`}>
                Scraping Results
              </h4>
              
              <div className={`overflow-x-auto rounded-lg border ${
                isDarkMode ? "border-gray-600" : "border-gray-200"
              }`}>
                <table className="w-full">
                  <thead className={`${
                    isDarkMode ? "bg-gray-800" : "bg-gray-50"
                  }`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-text-secondary" : "text-gray-500"
                      }`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-text-secondary" : "text-gray-500"
                      }`}>
                        Details
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-text-secondary" : "text-gray-500"
                      }`}>
                        Download
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDarkMode ? "divide-gray-700" : "divide-gray-200"
                  }`}>
                    {scrapingJobs.map((result: any) => (
                      <tr key={result.id} className={`${
                        isDarkMode ? "bg-[#0f1419] hover:bg-gray-800" : "bg-white hover:bg-gray-50"
                      } transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : result.status === "ready_for_download"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {result.status === "completed" ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Completed
                              </>
                            ) : result.status === "ready_for_download" ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                                </svg>
                                Ready to Download
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing
                              </>
                            )}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-text-primary" : "text-gray-900"
                        }`}>
                          {result.details}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDownload(result)}
                            disabled={result.status === "processing"}
                            className={`p-2 rounded-lg transition-colors ${
                              result.status === "completed" || result.status === "ready_for_download"
                                ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            title={
                              result.status === "completed" 
                                ? "Download file" 
                                : result.status === "ready_for_download"
                                ? "Get download link"
                                : "Processing..."
                            }
                          >
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                              <polyline points="7,10 12,15 17,10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 