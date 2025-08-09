import { useState, useMemo } from "react";
import type { Business } from "../types";
import { useTheme } from "../context/ThemeContext";

import AddGoogleBusinessModal from "../components/AddGoogleBusinessModal";
import DataImportModal from "../components/CsvImportModal";

interface Props {
  businesses: Business[];
  onToggleStar: (id: string) => void;
  categories: readonly string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  loading: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

interface DomainLookupResult {
  email1: string | null;
  email2: string | null;
  social: {
    fb?: string;
    instagram?: string;
  };
  fb: {
    ads: string;
  };
  google: {
    ads: string;
  };
}

export default function GooglePage({ businesses, onToggleStar, categories, selectedCategory, onSelectCategory, loading }: Props) {
  const { isDarkMode } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<DomainLookupResult | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [ratingSortDirection, setRatingSortDirection] = useState<SortDirection>(null);
  
  // State for verification functionality
  const [verifiedBusinesses, setVerifiedBusinesses] = useState<Set<string>>(new Set());
  const [verifyingBusinesses, setVerifyingBusinesses] = useState<Set<string>>(new Set());

  // State for add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);

  // Handle successful business addition
  const handleBusinessAdded = async () => {
    // Could reload data here if needed
    console.log('Business added successfully');
  };

  // Filter and sort businesses (only show ratings < 3.9)
  const sortedBusinesses = useMemo(() => {
    // Always filter for businesses with ratings < 3.9
    const filteredBusinesses = businesses.filter(business => business.rating < 3.9);

    // Then apply sorting if needed
    if (!ratingSortDirection) {
      return filteredBusinesses;
    }

    return [...filteredBusinesses].sort((a, b) => {
      if (ratingSortDirection === 'desc') {
        return b.rating - a.rating; // High to Low
      } else {
        return a.rating - b.rating; // Low to High
      }
    });
  }, [businesses, ratingSortDirection]);

  const handleRatingSort = () => {
    if (ratingSortDirection === null) {
      setRatingSortDirection('desc'); // First click: High to Low
    } else if (ratingSortDirection === 'desc') {
      setRatingSortDirection('asc'); // Second click: Low to High
    } else {
      setRatingSortDirection(null); // Third click: Reset to original order
    }
  };

  const handleDomainLookup = async (domain: string) => {
    if (!domain || domain === "-") {
      alert("No domain available for this business");
      return;
    }

    setIsLoading(true);
    setCurrentDomain(domain);
    setIsModalOpen(true);

    try {
      // Clean domain - remove http/https if present
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Use the correct URL format with domain parameter
      const apiUrl = `https://aramexshipping.app.n8n.cloud/webhook/lookup-domain?domain=${cleanDomain}`;
      
      console.log("Making API call to:", apiUrl);
      console.log("Domain being looked up:", cleanDomain);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response data:", data);
      
      // The response is an array, so we take the first item
      if (Array.isArray(data) && data.length > 0) {
        setModalData(data[0]);
      } else if (data && typeof data === 'object') {
        // In case the response is not an array but a single object
        setModalData(data);
      } else {
        console.log("No valid data received:", data);
        setModalData(null);
      }
    } catch (error) {
      console.error("Error fetching domain data:", error);
      setModalData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
    setCurrentDomain("");
  };

  // Function to handle business verification
  const handleVerifyBusiness = async (businessId: string) => {
    if (verifiedBusinesses.has(businessId) || verifyingBusinesses.has(businessId)) {
      return; // Already verified or currently verifying
    }

    // Add to verifying set
    setVerifyingBusinesses(prev => new Set(prev).add(businessId));

    // Simulate API call delay
    setTimeout(() => {
      // Remove from verifying set and add to verified set
      setVerifyingBusinesses(prev => {
        const newSet = new Set(prev);
        newSet.delete(businessId);
        return newSet;
      });
      
      setVerifiedBusinesses(prev => new Set(prev).add(businessId));
    }, 1500); // 1.5 second delay to simulate API call
  };

  return (
    <section className="max-w-screen-xl mx-auto py-6 px-4 space-y-6 font-mono">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-bold mb-2 ${
          isDarkMode ? 'text-text-primary' : 'text-gray-900'
        }`}>Google Business Directory</h1>
        <p className={`text-sm ${
          isDarkMode ? 'text-text-secondary' : 'text-gray-600'
        }`}>Discover and connect with businesses via Google Business listings</p>
      </div>

      {/* Category dropdown and controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Left side filters */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <label className="text-sm font-semibold text-text-secondary uppercase tracking-widest whitespace-nowrap">Category</label>
          <div className="relative">
            <select
              className={`w-40 pl-3 pr-8 py-1 text-sm border rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-accent appearance-none ${
                isDarkMode 
                  ? 'border-gray-400 bg-[#181B26] text-text-primary' 
                  : 'border-gray-400 bg-white text-gray-900'
              }`}
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
            >
              {categories.map((c: string) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {/* Visual-only Country dropdown */}
          <div className="relative w-40">
            <select className={`w-full pl-3 pr-8 py-1 text-sm border rounded-md font-mono focus:outline-none appearance-none ${
              isDarkMode 
                ? 'border-gray-400 bg-[#181B26] text-text-secondary' 
                : 'border-gray-400 bg-white text-gray-500'
            }`} disabled defaultValue="">
              <option value="" disabled>Country</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {/* Visual-only City or town dropdown */}
          <div className="relative w-40">
            <select className={`w-full pl-3 pr-8 py-1 text-sm border rounded-md font-mono focus:outline-none appearance-none ${
              isDarkMode 
                ? 'border-gray-400 bg-[#181B26] text-text-secondary' 
                : 'border-gray-400 bg-white text-gray-500'
            }`} disabled defaultValue="">
              <option value="" disabled>City or town</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {loading && <span className="text-xs text-accent font-semibold animate-pulse whitespace-nowrap">Loading…</span>}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          <input
            type="text"
            placeholder="Search Business"
            className={`w-48 pl-3 pr-3 py-1 text-sm border rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-accent ${
              isDarkMode 
                ? 'border-gray-400 bg-[#181B26] text-text-primary placeholder-text-secondary' 
                : 'border-gray-400 bg-white text-gray-900 placeholder-gray-500'
            }`}
          />
          <button className="flex items-center justify-center w-10 h-10 bg-[#4FF5AC] rounded-md hover:bg-[#3FE59C] transition-colors flex-shrink-0">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={() => setIsCsvImportModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors font-mono text-sm whitespace-nowrap"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Import CSV
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/80 transition-colors font-mono text-sm whitespace-nowrap"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Business
            </button>
          </div>
        </div>
      </div>

      {/* Business table */}
      <div className={`overflow-x-auto shadow-glow-border rounded-none border ${
        isDarkMode 
          ? 'bg-[#181B26] border-gray-600' 
          : 'bg-white border-gray-300'
      }`}>
        <table className="w-full text-sm border-collapse font-mono rounded-none table-fixed">
          <thead className={`text-gray-500 text-xs uppercase tracking-widest rounded-none ${
            isDarkMode ? 'bg-[#101322]' : 'bg-gray-100'
          }`}>
            <tr className="rounded-none">
              <th className={`w-16 min-w-16 px-4 py-2 text-left border-b border-r rounded-none ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>Save</th>
              <th className={`w-1/3 min-w-32 px-4 py-2 text-left border-b border-r rounded-none ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>Name</th>
              <th className={`w-36 min-w-36 px-4 py-2 text-left border-b border-r rounded-none ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <button
                  onClick={handleRatingSort}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer w-full"
                >
                  <span>Rating</span>
                  <div className="flex flex-col items-center justify-center">
                    <svg 
                      width="12" 
                      height="6" 
                      viewBox="0 0 12 6" 
                      fill="none" 
                      className={`transition-colors ${ratingSortDirection === 'asc' ? 'text-accent' : 'text-gray-600'}`}
                    >
                      <path d="M6 0L12 6H0L6 0Z" fill="currentColor"/>
                    </svg>
                    <svg 
                      width="12" 
                      height="6" 
                      viewBox="0 0 12 6" 
                      fill="none" 
                      className={`transition-colors ${ratingSortDirection === 'desc' ? 'text-accent' : 'text-gray-600'}`}
                    >
                      <path d="M6 6L0 0H12L6 6Z" fill="currentColor"/>
                    </svg>
                  </div>
                </button>
              </th>
              <th className={`w-24 min-w-24 px-4 py-2 text-left border-b border-r rounded-none ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>Reviews</th>
              <th className={`w-1/4 min-w-28 px-4 py-2 text-left border-b border-r rounded-none ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>Address</th>
              <th className={`w-1/4 min-w-24 px-4 py-2 text-left border-b border-r rounded-none ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>Domain</th>
              <th className={`w-32 min-w-32 px-4 py-2 text-left border-b border-r rounded-none ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>Socials</th>
              <th className={`w-20 min-w-20 px-4 py-2 text-center border-b rounded-none ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>Verify</th>
            </tr>
          </thead>
          <tbody>
            {sortedBusinesses.map((b, i) => (
              <tr key={b.id} className={`border-t transition rounded-none ${
                isDarkMode 
                  ? `border-gray-600 ${i % 2 === 0 ? 'bg-[#0C1125]' : 'bg-[#181C2F]'} hover:bg-[#23263a]`
                  : `border-gray-300 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`
              }`}>
                <td className={`px-4 py-2 text-center border-r rounded-none ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={b.isStarred}
                    onChange={() => onToggleStar(b.id)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                    aria-label="Select business for messaging"
                  />
                </td>
                <td className={`px-4 py-2 font-normal border-r rounded-none ${
                  isDarkMode 
                    ? 'text-text-primary border-gray-600' 
                    : 'text-gray-900 border-gray-300'
                }`}>{b.name}</td>
                <td className={`px-4 py-2 text-center text-success font-bold border-r rounded-none ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <span className="inline-flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="#2DF1B0" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle"><path d="M10 15.27L16.18 18l-1.64-7.03L19 7.24l-7.19-.61L10 0 8.19 6.63 1 7.24l5.46 3.73L4.82 18z"/></svg>
                    {b.rating.toFixed(1)}
                  </span>
                </td>
                <td className={`px-4 py-2 text-center border-r rounded-none ${
                  isDarkMode 
                    ? 'text-text-secondary border-gray-600' 
                    : 'text-gray-600 border-gray-300'
                }`}>{b.reviews}</td>
                <td className={`px-4 py-2 border-r rounded-none truncate max-w-0 ${
                  isDarkMode 
                    ? 'text-text-secondary border-gray-600' 
                    : 'text-gray-600 border-gray-300'
                }`}>{b.city}</td>
                <td className={`px-4 py-2 border-r rounded-none truncate max-w-0 ${
                  isDarkMode 
                    ? 'text-text-secondary border-gray-600' 
                    : 'text-gray-600 border-gray-300'
                }`}>{b.domain || "-"}</td>
                <td className={`px-4 py-2 text-center border-r rounded-none ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    {/* Instagram */}
                    <a href="#" className="text-gray-400 hover:text-[#E4405F] transition-colors" aria-label="Instagram">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    {/* LinkedIn */}
                    <a href="#" className="text-gray-400 hover:text-[#0077B5] transition-colors" aria-label="LinkedIn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                    {/* Facebook */}
                    <a href="#" className="text-gray-400 hover:text-[#1877F2] transition-colors" aria-label="Facebook">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    {/* Website Link */}
                    <button 
                      onClick={() => handleDomainLookup(b.domain || "")} 
                      className="text-gray-400 hover:text-[#10B981] transition-colors" 
                      aria-label="Lookup Domain Info"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                    </button>
                  </div>
                </td>
                <td className={`px-4 py-2 text-center rounded-none ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <button
                    onClick={() => handleVerifyBusiness(b.id)}
                    disabled={verifyingBusinesses.has(b.id) || verifiedBusinesses.has(b.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      verifiedBusinesses.has(b.id)
                        ? 'bg-green-500 border-green-500 text-white cursor-default'
                        : verifyingBusinesses.has(b.id)
                        ? 'border-blue-500 cursor-not-allowed'
                        : isDarkMode
                        ? 'border-gray-400 text-gray-400 hover:border-blue-500 hover:text-blue-500 cursor-pointer'
                        : 'border-gray-400 text-gray-400 hover:border-blue-500 hover:text-blue-500 cursor-pointer'
                    }`}
                    title={
                      verifiedBusinesses.has(b.id) 
                        ? 'Verified' 
                        : verifyingBusinesses.has(b.id) 
                        ? 'Verifying...' 
                        : 'Click to verify'
                    }
                  >
                    {verifyingBusinesses.has(b.id) ? (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : verifiedBusinesses.has(b.id) ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {!sortedBusinesses.length && (
              <tr>
                <td colSpan={8} className={`text-center py-10 rounded-none ${
                  isDarkMode ? 'text-text-secondary' : 'text-gray-500'
                }`}>No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Domain Lookup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`border rounded-lg p-6 max-w-md w-full mx-4 shadow-glow-border ${
            isDarkMode 
              ? 'bg-[#181B26] border-gray-600' 
              : 'bg-white border-gray-300'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${
                isDarkMode ? 'text-text-primary' : 'text-gray-900'
              }`}>Domain Lookup: {currentDomain}</h3>
              <button 
                onClick={closeModal}
                className={`hover:text-text-primary ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M6 18L18 6"/>
                </svg>
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                <p className={`mt-2 ${
                  isDarkMode ? 'text-text-secondary' : 'text-gray-600'
                }`}>Loading domain information...</p>
              </div>
            ) : modalData ? (
              <div className="space-y-4 text-sm">
                {/* Email Information */}
                <div>
                  <h4 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-text-primary' : 'text-gray-900'
                  }`}>Email Addresses</h4>
                  <div className="space-y-1">
                    <p className={`${
                      isDarkMode ? 'text-text-secondary' : 'text-gray-600'
                    }`}>
                      <span className="font-medium">Email 1:</span> {modalData.email1 || "Not found"}
                    </p>
                    <p className={`${
                      isDarkMode ? 'text-text-secondary' : 'text-gray-600'
                    }`}>
                      <span className="font-medium">Email 2:</span> {modalData.email2 || "Not found"}
                    </p>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h4 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-text-primary' : 'text-gray-900'
                  }`}>Social Media</h4>
                  <div className="space-y-1">
                    <p className={`${
                      isDarkMode ? 'text-text-secondary' : 'text-gray-600'
                    }`}>
                      <span className="font-medium">Facebook:</span> 
                      {modalData.social.fb ? (
                        <a href={modalData.social.fb} target="_blank" rel="noopener noreferrer" className="text-[#1877F2] hover:underline ml-1">
                          {modalData.social.fb}
                        </a>
                      ) : " Not found"}
                    </p>
                    <p className={`${
                      isDarkMode ? 'text-text-secondary' : 'text-gray-600'
                    }`}>
                      <span className="font-medium">Instagram:</span> 
                      {modalData.social.instagram ? (
                        <a href={modalData.social.instagram} target="_blank" rel="noopener noreferrer" className="text-[#E4405F] hover:underline ml-1">
                          {modalData.social.instagram}
                        </a>
                      ) : " Not found"}
                    </p>
                  </div>
                </div>

                {/* Advertising Information */}
                <div>
                  <h4 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-text-primary' : 'text-gray-900'
                  }`}>Advertising</h4>
                  <div className="space-y-1">
                    <p className={`${
                      isDarkMode ? 'text-text-secondary' : 'text-gray-600'
                    }`}>
                      <span className="font-medium">Facebook Ads:</span> 
                      <span className={`ml-1 ${modalData.fb.ads === "true" ? "text-green-400" : "text-red-400"}`}>
                        {modalData.fb.ads === "true" ? "Active" : "Inactive"}
                      </span>
                    </p>
                    <p className={`${
                      isDarkMode ? 'text-text-secondary' : 'text-gray-600'
                    }`}>
                      <span className="font-medium">Google Ads:</span> 
                      <span className={`ml-1 ${modalData.google.ads === "true" ? "text-green-400" : "text-red-400"}`}>
                        {modalData.google.ads === "true" ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-red-400">Failed to fetch domain information</p>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-text-secondary' : 'text-gray-600'
                }`}>Please try again later</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button 
                onClick={closeModal}
                className={`px-4 py-2 rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Business Modal */}
      <AddGoogleBusinessModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleBusinessAdded}
      />

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={isCsvImportModalOpen}
        onClose={() => setIsCsvImportModalOpen(false)}
        onSuccess={handleBusinessAdded}
      />
    </section>
  );
} 