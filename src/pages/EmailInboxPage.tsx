import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import emailService, { type InboundEmail } from '../services/emailService';
import TestWebhookButton from '../components/TestWebhookButton';

export default function EmailInboxPage() {
  const { isDarkMode } = useTheme();
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unmatched'>('all');

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
    fetchEmails();
  }, []);

  // Filter emails based on search term and filter
  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'unmatched' && !email.businessId);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getEmailPreview = (text: string) => {
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className={`border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold">Email Inbox</h1>
              <p className="text-sm text-gray-500">
                {emails.length} total emails • {emails.filter(e => !e.businessId).length} unmatched
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <TestWebhookButton compact />
              <button
                onClick={fetchEmails}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

             {/* Search and Filters */}
       <div className={`border-b ${
         isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
       }`}>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
           <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1">
               <input
                 type="text"
                 placeholder="Search emails..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className={`w-full px-3 py-2 border rounded-md ${
                   isDarkMode
                     ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                     : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                 }`}
               />
             </div>
             <div className="flex gap-2">
               <select
                 value={filter}
                 onChange={(e) => setFilter(e.target.value as 'all' | 'unmatched')}
                 className={`px-3 py-2 border rounded-md ${
                   isDarkMode
                     ? 'bg-gray-700 border-gray-600 text-white'
                     : 'bg-white border-gray-300 text-gray-900'
                 }`}
               >
                 <option value="all">All Emails</option>
                 <option value="unmatched">Unmatched Only</option>
               </select>
             </div>
           </div>
         </div>
       </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

             {/* Email List and Detail View */}
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
           {/* Email List */}
           <div className={`xl:col-span-1 rounded-lg border ${
             isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
           }`}>
             <div className="p-4 border-b border-gray-200 dark:border-gray-700">
               <h2 className="text-lg font-semibold">
                 Emails ({filteredEmails.length})
               </h2>
             </div>
             <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredEmails.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No emails match your search' : 'No emails found'}
                </div>
              ) : (
                                 filteredEmails.map((email) => (
                   <div
                     key={email.id}
                     onClick={() => setSelectedEmail(email)}
                     className={`p-4 border-b cursor-pointer transition-colors ${
                       isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                     } ${selectedEmail?.id === email.id ? 
                       (isDarkMode ? 'bg-blue-900' : 'bg-blue-50') : ''
                     }`}
                   >
                     <div className="flex items-start justify-between mb-2">
                       <div className="font-medium text-sm truncate flex-1">
                         {email.from}
                       </div>
                       <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                         {formatDate(email.timestamp).split(',')[0]}
                       </div>
                     </div>
                     <div className="font-semibold text-sm mb-1 truncate">
                       {email.subject}
                     </div>
                     <div className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                       {getEmailPreview(email.text)}
                     </div>
                     <div className="flex justify-between items-center">
                       {email.businessId && email.businessId !== 'This' ? (
                         <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                           ✓ {email.businessId}
                         </span>
                       ) : (
                         <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                           ⚠ No business match
                         </span>
                       )}
                     </div>
                   </div>
                 ))
              )}
            </div>
          </div>

                     {/* Email Detail */}
           <div className={`xl:col-span-2 rounded-lg border ${
             isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
           }`}>
            {selectedEmail ? (
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-2">{selectedEmail.subject}</h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div><strong>From:</strong> {selectedEmail.from}</div>
                      <div><strong>To:</strong> {selectedEmail.to}</div>
                      <div><strong>Date:</strong> {formatDate(selectedEmail.timestamp)}</div>
                    </div>
                  </div>
                                     <div className="text-right">
                     {selectedEmail.businessId && selectedEmail.businessId !== 'This' ? (
                       <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                         ✓ Matched to {selectedEmail.businessId}
                       </span>
                     ) : (
                       <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                         ⚠ No business match
                       </span>
                     )}
                   </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Text Content</h3>
                    <div className={`p-4 rounded border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <pre className="whitespace-pre-wrap text-sm">{selectedEmail.text}</pre>
                    </div>
                  </div>

                  {selectedEmail.html && (
                    <div>
                      <h3 className="font-semibold mb-2">HTML Content</h3>
                      <div className={`p-4 rounded border ${
                        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Headers</h3>
                    <div className={`p-4 rounded border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedEmail.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p>Select an email to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 