import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { testSupabaseConnection, testTriggerCreation } from "../utils/testSupabase";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    company: "",
    role: "user" as "admin" | "user" | "viewer"
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const success = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role
      });

      if (success) {
        navigate("/dashboard");
      } else {
        setError("Failed to create account. Please check the console for details and try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const runDebugTests = async () => {
    setDebugInfo("Running debug tests...");
    console.log("🔍 Running debug tests...");
    
    const connectionTest = await testSupabaseConnection();
    const triggerTest = await testTriggerCreation();
    
    const results = `Connection: ${connectionTest ? '✅' : '❌'}, Trigger: ${triggerTest ? '✅' : '❌'}`;
    setDebugInfo(results);
    console.log("🔍 Debug test results:", results);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isDarkMode ? "bg-background" : "bg-gray-50"
    }`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${
            isDarkMode ? "text-text-primary" : "text-gray-900"
          }`}>
            Create your account
          </h2>
          <p className={`mt-2 text-center text-sm ${
            isDarkMode ? "text-text-secondary" : "text-gray-600"
          }`}>
            Or{" "}
            <Link
              to="/login"
              className={`font-medium hover:underline ${
                isDarkMode ? "text-accent hover:text-accent/80" : "text-blue-600 hover:text-blue-500"
              }`}
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className={`rounded-md p-4 ${
              isDarkMode ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"
            }`}>
              <p className={`text-sm ${
                isDarkMode ? "text-red-400" : "text-red-600"
              }`}>
                {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className={`block text-sm font-medium ${
                isDarkMode ? "text-text-primary" : "text-gray-700"
              }`}>
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  isDarkMode
                    ? "bg-[#101322] border-gray-600 text-text-primary focus:border-accent focus:ring-accent"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${
                isDarkMode ? "text-text-primary" : "text-gray-700"
              }`}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  isDarkMode
                    ? "bg-[#101322] border-gray-600 text-text-primary focus:border-accent focus:ring-accent"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="company" className={`block text-sm font-medium ${
                isDarkMode ? "text-text-primary" : "text-gray-700"
              }`}>
                Company (Optional)
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  isDarkMode
                    ? "bg-[#101322] border-gray-600 text-text-primary focus:border-accent focus:ring-accent"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Enter your company name"
              />
            </div>

            <div>
              <label htmlFor="role" className={`block text-sm font-medium ${
                isDarkMode ? "text-text-primary" : "text-gray-700"
              }`}>
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  isDarkMode
                    ? "bg-[#101322] border-gray-600 text-text-primary focus:border-accent focus:ring-accent"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                }`}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${
                isDarkMode ? "text-text-primary" : "text-gray-700"
              }`}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  isDarkMode
                    ? "bg-[#101322] border-gray-600 text-text-primary focus:border-accent focus:ring-accent"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-medium ${
                isDarkMode ? "text-text-primary" : "text-gray-700"
              }`}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  isDarkMode
                    ? "bg-[#101322] border-gray-600 text-text-primary focus:border-accent focus:ring-accent"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md transition-colors ${
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              } ${
                isDarkMode ? "bg-blue-600 text-white" : "bg-blue-600 text-white"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          <div className={`text-xs text-center ${
            isDarkMode ? "text-text-secondary" : "text-gray-500"
          }`}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </div>

          {/* Debug Section */}
          <div className="mt-4 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={runDebugTests}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isDarkMode 
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300" 
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              🔍 Run Debug Tests
            </button>
            {debugInfo && (
              <div className={`mt-2 text-xs text-center ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}>
                {debugInfo}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 