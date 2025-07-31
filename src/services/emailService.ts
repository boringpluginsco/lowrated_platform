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