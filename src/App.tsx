import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DirectoryPage from "./pages/DirectoryPage";
import MessagingPage from "./pages/MessagingPage";
import LoginPage from "./pages/LoginPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import GooglePage from "./pages/GooglePage";
import DashboardPage from "./pages/DashboardPage";
import Layout from "./Layout";
// import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import type { Business, Message } from "./types";
import businessesData from "./data/businesses.json";
import googleBusinessData from "./data/NZ-20250718185135s80_doctor.json";
import { fetchLeads } from "./utils/fetchLeads";
import { 
  saveStarredBusinesses, 
  loadStarredBusinesses, 
  saveStarredGoogleBusinesses, 
  loadStarredGoogleBusinesses,
  saveMessagesByBusiness,
  loadMessagesByBusiness
} from "./utils/persistence";

// Type for the Google business data structure
interface GoogleBusiness {
  name: string;
  rating: number;
  reviews: number;
  full_address: string;
  site?: string;
  phone?: string;
  city?: string;
  email_1?: string;
  email_2?: string;
  email_3?: string;
}

// Transform Google business data to Business type
const transformGoogleData = (googleData: GoogleBusiness[]): Business[] => {
  return googleData.map((item, index) => ({
    id: `google-${index}`,
    name: item.name,
    rating: item.rating || 0,
    reviews: item.reviews || 0,
    city: item.full_address, // Using full_address for the ADDRESS column
    domain: item.site || "-",
    email_1: item.email_1,
    email_2: item.email_2,
    email_3: item.email_3,
    isStarred: false
  }));
};

const CATEGORIES = ["Default", "Animal Health", "Cats & Dogs", "Animal Parks & Zoo"] as const;

export default function App() {
  const { isAuthenticated } = useAuth();
  
  // Initialize businesses with persisted starred state
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const starredIds = loadStarredBusinesses();
    return businessesData.map(business => ({
      ...business,
      isStarred: starredIds.includes(business.id)
    }));
  });
  
  const [googleBusinesses, setGoogleBusinesses] = useState<Business[]>(() => {
    const transformed = transformGoogleData(googleBusinessData as GoogleBusiness[]);
    const starredIds = loadStarredGoogleBusinesses();
    return transformed.map(business => ({
      ...business,
      isStarred: starredIds.includes(business.id)
    }));
  });
  
  const [messagesByBusiness, setMessagesByBusiness] = useState<Record<string, Message[]>>(() => 
    loadMessagesByBusiness()
  );
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Default");
  const [loading, setLoading] = useState(false);

  // When user picks a non‑default category, fetch remote leads
  const handleSelectCategory = async (cat: string) => {
    setCategory(cat as any);
    if (cat === "Default") {
      setBusinesses(businessesData);
      return;
    }
    setLoading(true);
    try {
      const leads = await fetchLeads(cat);
      setBusinesses(leads);
    } catch (err) {
      console.error(err);
      alert("Could not load leads for " + cat);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelectCategory = async (cat: string) => {
    if (cat === "Default") {
      setGoogleBusinesses(transformGoogleData(googleBusinessData as GoogleBusiness[]));
      return;
    }
    // For now, just reset to default Google data for other categories
    // This could be extended to fetch different Google data based on category
    setGoogleBusinesses(transformGoogleData(googleBusinessData as GoogleBusiness[]));
  };

  const toggleStar = (id: string) => {
    setBusinesses((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, isStarred: !b.isStarred } : b));
      // Persist starred business IDs
      const starredIds = updated.filter(b => b.isStarred).map(b => b.id);
      saveStarredBusinesses(starredIds);
      return updated;
    });
  };

  const toggleGoogleStar = (id: string) => {
    setGoogleBusinesses((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, isStarred: !b.isStarred } : b));
      // Persist starred Google business IDs
      const starredIds = updated.filter(b => b.isStarred).map(b => b.id);
      saveStarredGoogleBusinesses(starredIds);
      return updated;
    });
  };

  // Combine starred businesses from both Trust Pilot and Google
  const allStarredBusinesses = [
    ...businesses.filter((b) => b.isStarred),
    ...googleBusinesses.filter((b) => b.isStarred)
  ];

  const sendMessage = (bizId: string, text: string) => {
    setMessagesByBusiness((prev) => {
      const updated = {
        ...prev,
        [bizId]: [
          ...(prev[bizId] || []),
          { id: crypto.randomUUID(), text, timestamp: Date.now(), direction: "outgoing" as const },
        ],
      };
      // Persist messages
      saveMessagesByBusiness(updated);
      return updated;
    });
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout>
              <DirectoryPage
                businesses={businesses}
                onToggleStar={toggleStar}
                categories={CATEGORIES}
                selectedCategory={category}
                onSelectCategory={handleSelectCategory}
                loading={loading}
              />
            </Layout>
          ) : (
            <Layout>
              <PlaceholderPage 
                title="Create a business network in under two minutes"
                subtitle="People use B2B Business Listings to process payments, build communities, host products, and build store pages."
              />
            </Layout>
          )
        }
      />
      <Route
        path="/messages"
        element={
          isAuthenticated ? (
            <Layout>
              <MessagingPage
                businesses={allStarredBusinesses}
                messagesByBusiness={messagesByBusiness}
                sendMessage={sendMessage}
              />
            </Layout>
          ) : (
            <Layout>
              <PlaceholderPage 
                title="Connect with your business network"
                subtitle="Start conversations, build relationships, and grow your business with our integrated messaging platform."
              />
            </Layout>
          )
        }
      />
      <Route
        path="/analytics"
        element={
          isAuthenticated ? (
            <Layout>
              <AnalyticsPage />
            </Layout>
          ) : (
            <Layout>
              <PlaceholderPage 
                title="Unlock powerful analytics insights"
                subtitle="Track your business performance, conversion rates, and campaign effectiveness with advanced reporting tools."
              />
            </Layout>
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Layout>
              <DashboardPage businesses={allStarredBusinesses} />
            </Layout>
          ) : (
            <Layout>
              <PlaceholderPage 
                title="Access your business dashboard"
                subtitle="Monitor your outreach pipeline, track business stages, and manage your communication workflow."
              />
            </Layout>
          )
        }
      />
      <Route
        path="/google"
        element={
          isAuthenticated ? (
            <Layout>
              <GooglePage
                businesses={googleBusinesses}
                onToggleStar={toggleGoogleStar}
                categories={CATEGORIES}
                selectedCategory={category}
                onSelectCategory={handleGoogleSelectCategory}
                loading={false}
              />
            </Layout>
          ) : (
            <Layout>
              <PlaceholderPage 
                title="Access Google advertising insights"
                subtitle="Monitor your Google Ads performance, search volume trends, and advertising ROI with comprehensive reporting."
              />
            </Layout>
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}