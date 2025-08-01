import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function TestWebhookButton() {
  const { isDarkMode } = useTheme();
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    setLoading(true);
    setStatus('Testing webhook...');
    
    try {
      console.log('🔧 Testing API configuration...');
      console.log('🔧 API_BASE_URL:', API_BASE_URL);
      console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL);
      
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Health check passed: ${data.message}`);
        console.log('✅ Health check response:', data);
      } else {
        setStatus(`❌ Health check failed: ${response.status}`);
        console.error('❌ Health check failed:', response.status, data);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testInboundEmails = async () => {
    setLoading(true);
    setStatus('Testing inbound emails...');
    
    try {
      console.log('🔧 Testing inbound emails endpoint...');
      console.log('🔧 Full URL:', `${API_BASE_URL}/email/inbound?limit=50`);
      
      const response = await fetch(`${API_BASE_URL}/email/inbound?limit=50`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Inbound emails test passed: Found ${data.count} emails`);
        console.log('✅ Inbound emails response:', data);
      } else {
        setStatus(`❌ Inbound emails test failed: ${response.status}`);
        console.error('❌ Inbound emails test failed:', response.status, data);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Inbound emails test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <h3 className="text-lg font-semibold mb-4">API Configuration Test</h3>
      
      <div className="mb-4">
        <p className="text-sm mb-2">
          <strong>API Base URL:</strong> {API_BASE_URL}
        </p>
        <p className="text-sm mb-2">
          <strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || 'Not set (using default)'}
        </p>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={testWebhook}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600' 
              : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400'
          } text-white disabled:opacity-50`}
        >
          {loading ? 'Testing...' : 'Test Health Check'}
        </button>
        
        <button
          onClick={testInboundEmails}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            isDarkMode 
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600' 
              : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-400'
          } text-white disabled:opacity-50 ml-2`}
        >
          {loading ? 'Testing...' : 'Test Inbound Emails'}
        </button>
      </div>
      
      {status && (
        <div className={`mt-4 p-3 rounded text-sm ${
          status.includes('✅') 
            ? (isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
            : (isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
        }`}>
          {status}
        </div>
      )}
    </div>
  );
} 