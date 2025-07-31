import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import emailService, { type InboundEmail } from '../services/emailService';

interface EmailViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailViewer({ isOpen, onClose }: EmailViewerProps) {
  const { isDarkMode } = useTheme();
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await emailService.getInboundEmails();
      if (response.success) {
        setEmails(response.data);
      } else {
        setError(response.error || 'Failed to fetch emails');
      }
    } catch (err) {
      setError('Error fetching emails');
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-4xl h-5/6 rounded-lg shadow-xl flex flex-col ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-gray-600' : 'border-gray-200'
          }`}
        >
          <h2 className="text-xl font-semibold">Inbound Emails ({emails.length})</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              disabled={loading}
              className={`px-3 py-1 rounded text-sm ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600'
                  : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300'
              } text-white`}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded hover:bg-gray-200 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No inbound emails found
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        From: {email.from}
                      </div>
                      <div className="text-sm text-gray-500 mb-1">
                        To: {email.to}
                      </div>
                      <div className="font-medium">
                        {email.subject}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      {new Date(email.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  {email.businessId && (
                    <div className="mb-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Business: {email.businessId}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <div className="mb-2">
                      <strong>Text:</strong>
                      <div className="mt-1 p-2 bg-white rounded border text-gray-800 max-h-32 overflow-y-auto">
                        {email.text || 'No text content'}
                      </div>
                    </div>
                    
                    {email.html && (
                      <div>
                        <strong>HTML:</strong>
                        <div className="mt-1 p-2 bg-white rounded border text-gray-800 max-h-32 overflow-y-auto">
                          <div dangerouslySetInnerHTML={{ __html: email.html }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 