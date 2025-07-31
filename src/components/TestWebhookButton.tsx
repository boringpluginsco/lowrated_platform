import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface TestWebhookButtonProps {
  compact?: boolean;
}

export default function TestWebhookButton({ compact = false }: TestWebhookButtonProps) {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sendTestEmail = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const testEmail = {
        from: 'test@example.com',
        to: 'jordan@galleongroup.co',
        subject: 'Test Email - ' + new Date().toLocaleString(),
        html: '<p>This is a test email sent at ' + new Date().toLocaleString() + '</p>',
        text: 'This is a test email sent at ' + new Date().toLocaleString(),
        headers: {
          'message-id': 'test-' + Date.now() + '@example.com',
          'references': 'test-reference@example.com'
        },
        attachments: []
      };

      const response = await fetch('http://localhost:3001/api/email/inbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testEmail)
      });

      if (response.ok) {
        setResult('✅ Test email sent successfully! Check the email inbox.');
      } else {
        const error = await response.text();
        setResult('❌ Error: ' + error);
      }
    } catch (error) {
      setResult('❌ Error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={sendTestEmail}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isDarkMode
            ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white'
            : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white'
        }`}
        title="Send test email to webhook"
      >
        {isLoading ? 'Sending...' : 'Test Email'}
      </button>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <h3 className="text-lg font-semibold mb-2">Test Webhook</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Send a test email to verify the webhook is working
      </p>
      
      <button
        onClick={sendTestEmail}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isDarkMode
            ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white'
        }`}
      >
        {isLoading ? 'Sending...' : 'Send Test Email'}
      </button>
      
      {result && (
        <div className={`mt-3 p-3 rounded text-sm ${
          result.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-400'
            : 'bg-red-100 text-red-800 border border-red-400'
        }`}>
          {result}
        </div>
      )}
    </div>
  );
} 