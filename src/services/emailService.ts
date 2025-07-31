const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  from?: string;
  fromName?: string;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
  details?: string;
}

export interface InboundEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  text: string;
  html: string;
  timestamp: Date;
  direction: 'received';
  headers: Record<string, string>;
  attachments: any[];
  businessId?: string;
  receivedAt: string;
}

export interface InboundEmailResponse {
  success: boolean;
  data: InboundEmail[];
  count: number;
  error?: string;
}

class EmailService {
  private async makeRequest(endpoint: string, data?: any): Promise<EmailResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
    return this.makeRequest('/send-email', emailData);
  }

  async getInboundEmails(businessId?: string, limit: number = 50): Promise<InboundEmailResponse> {
    try {
      const params = new URLSearchParams();
      if (businessId) params.append('businessId', businessId);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`${API_BASE_URL}/email/inbound?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      // Convert timestamp strings back to Date objects
      if (result.data) {
        result.data = result.data.map((email: any) => ({
          ...email,
          timestamp: new Date(email.timestamp)
        }));
      }

      return result;
    } catch (error) {
      console.error('Error fetching inbound emails:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async syncInboundEmails(): Promise<InboundEmailResponse> {
    return this.getInboundEmails();
  }



  async checkHealth(): Promise<{ status: string; message: string } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Format email for display
  formatEmailForDisplay(emailData: EmailRequest): string {
    return `To: ${emailData.to}\nSubject: ${emailData.subject}\n\n${emailData.body}`;
  }
}

export const emailService = new EmailService();
export default emailService; 