import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface GoogleSheetsUpdaterProps {
  onUpdateComplete?: () => void;
}

export default function GoogleSheetsUpdater({ onUpdateComplete }: GoogleSheetsUpdaterProps) {
  const { isDarkMode } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [range, setRange] = useState('Sheet1!A:Z');

  const handleUpdate = async () => {
    if (!spreadsheetId.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a spreadsheet ID'
      });
      return;
    }

    setIsUpdating(true);
    setStatus({ type: null, message: null });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sheets/update-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId.trim(),
          range: range.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({
          type: 'success',
          message: `✅ Updated successfully! ${result.data.count} businesses processed.`
        });
        onUpdateComplete?.();
      } else {
        setStatus({
          type: 'error',
          message: `❌ Update failed: ${result.error}`
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestConnection = async () => {
    if (!spreadsheetId.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a spreadsheet ID'
      });
      return;
    }

    setIsUpdating(true);
    setStatus({ type: null, message: null });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sheets/info/${spreadsheetId.trim()}`);
      const result = await response.json();

      if (result.success) {
        setStatus({
          type: 'success',
          message: `✅ Connection successful! Sheet: "${result.data.title}"`
        });
      } else {
        setStatus({
          type: 'error',
          message: `❌ Connection failed: ${result.error}`
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`p-6 rounded-lg border ${
      isDarkMode 
        ? 'bg-[#181B26] border-gray-600' 
        : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        isDarkMode ? 'text-text-primary' : 'text-gray-900'
      }`}>
        📊 Google Sheets Updater
      </h3>

      <div className="space-y-4">
        {/* Spreadsheet ID Input */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-text-secondary' : 'text-gray-700'
          }`}>
            Spreadsheet ID
          </label>
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            className={`w-full px-3 py-2 border rounded-md ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <p className={`text-xs mt-1 ${
            isDarkMode ? 'text-text-secondary' : 'text-gray-600'
          }`}>
            Found in your Google Sheet URL: docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
          </p>
        </div>

        {/* Range Input */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-text-secondary' : 'text-gray-700'
          }`}>
            Range (optional)
          </label>
          <input
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="Sheet1!A:Z"
            className={`w-full px-3 py-2 border rounded-md ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        {/* Status Message */}
        {status.message && (
          <div className={`p-3 rounded-md ${
            status.type === 'success'
              ? (isDarkMode ? 'bg-green-900/20 border border-green-600' : 'bg-green-50 border border-green-200')
              : (isDarkMode ? 'bg-red-900/20 border border-red-600' : 'bg-red-50 border border-red-200')
          }`}>
            <p className={`text-sm ${
              status.type === 'success'
                ? (isDarkMode ? 'text-green-400' : 'text-green-800')
                : (isDarkMode ? 'text-red-400' : 'text-red-800')
            }`}>
              {status.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isUpdating
                ? (isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                : (isDarkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-500 text-white hover:bg-blue-600')
            }`}
          >
            {isUpdating ? 'Testing...' : '🔍 Test Connection'}
          </button>

          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isUpdating
                ? (isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                : (isDarkMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-green-500 text-white hover:bg-green-600')
            }`}
          >
            {isUpdating ? 'Updating...' : '🔄 Update JSON'}
          </button>
        </div>

        {/* Instructions */}
        <div className={`text-xs ${
          isDarkMode ? 'text-text-secondary' : 'text-gray-600'
        }`}>
          <p className="mb-2"><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter your Google Sheet ID from the URL</li>
            <li>Click "Test Connection" to verify access</li>
            <li>Click "Update JSON" to fetch and save the data</li>
            <li>The JSON file will be updated in the data directory</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 