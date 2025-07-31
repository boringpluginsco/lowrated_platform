import type { InboundEmail } from '../services/emailService';
import { loadEmailThreads, saveEmailThreads } from './persistence';

export interface EmailThread {
  businessId: string;
  emails: {
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp: Date;
    direction: 'sent' | 'received';
  }[];
}

export interface Business {
  id: string;
  name: string;
  email?: string;
}

// Sync inbound emails with existing email threads
export async function syncEmailThreads(
  inboundEmails: InboundEmail[],
  businesses: Business[]
): Promise<EmailThread[]> {
  const existingThreads = loadEmailThreads();
  const updatedThreads = [...existingThreads];

  for (const inboundEmail of inboundEmails) {
    // Try to find the business this email belongs to
    const businessId = findBusinessIdForEmail(inboundEmail, businesses);
    
    if (businessId) {
      // Find existing thread for this business
      let threadIndex = updatedThreads.findIndex(thread => thread.businessId === businessId);
      
      if (threadIndex === -1) {
        // Create new thread
        updatedThreads.push({
          businessId,
          emails: []
        });
        threadIndex = updatedThreads.length - 1;
      }

      // Check if this email is already in the thread
      const emailExists = updatedThreads[threadIndex].emails.some(
        (email: { id: string }) => email.id === inboundEmail.id
      );

      if (!emailExists) {
        // Add the inbound email to the thread
        updatedThreads[threadIndex].emails.push({
          id: inboundEmail.id,
          from: inboundEmail.from,
          to: inboundEmail.to,
          subject: inboundEmail.subject,
          body: inboundEmail.body,
          timestamp: inboundEmail.timestamp,
          direction: 'received' as const
        });

        // Sort emails by timestamp
        updatedThreads[threadIndex].emails.sort(
          (a: { timestamp: Date }, b: { timestamp: Date }) => a.timestamp.getTime() - b.timestamp.getTime()
        );
      }
    }
  }

  // Save updated threads
  saveEmailThreads(updatedThreads);
  return updatedThreads;
}

// Find business ID for an inbound email
function findBusinessIdForEmail(inboundEmail: InboundEmail, businesses: Business[]): string | null {
  // Method 1: Check if businessId is already set
  if (inboundEmail.businessId) {
    return inboundEmail.businessId;
  }

  // Method 2: Extract business name from subject and find matching business
  const businessName = extractBusinessNameFromSubject(inboundEmail.subject);
  if (businessName) {
    const matchingBusiness = businesses.find(business => 
      business.name.toLowerCase().includes(businessName.toLowerCase()) ||
      businessName.toLowerCase().includes(business.name.toLowerCase())
    );
    if (matchingBusiness) {
      return matchingBusiness.id;
    }
  }

  // Method 3: Extract business name from email body
  const businessNameFromBody = extractBusinessNameFromBody(inboundEmail.body);
  if (businessNameFromBody) {
    const matchingBusiness = businesses.find(business => 
      business.name.toLowerCase().includes(businessNameFromBody.toLowerCase()) ||
      businessNameFromBody.toLowerCase().includes(business.name.toLowerCase())
    );
    if (matchingBusiness) {
      return matchingBusiness.id;
    }
  }

  // Method 4: Check if sender email matches any business email
  const matchingBusiness = businesses.find(business => 
    business.email && business.email.toLowerCase() === inboundEmail.from.toLowerCase()
  );
  if (matchingBusiness) {
    return matchingBusiness.id;
  }

  return null;
}

// Extract business name from email subject
function extractBusinessNameFromSubject(subject: string): string | null {
  // Remove common prefixes
  const cleanSubject = subject
    .replace(/^(re|reply|fwd|forward):\s*/i, '')
    .trim();

  // Look for business name patterns
  const patterns = [
    /^(.+?)(?:\s*-\s*|$)/, // Everything before first dash or end
    /^(.+?)(?:\s*\(|$)/,   // Everything before first parenthesis or end
    /^(.+?)(?:\s*\[|$)/    // Everything before first bracket or end
  ];

  for (const pattern of patterns) {
    const match = cleanSubject.match(pattern);
    if (match && match[1].trim().length > 0) {
      return match[1].trim();
    }
  }

  return null;
}

// Extract business name from email body
function extractBusinessNameFromBody(body: string): string | null {
  // Remove HTML tags
  const textBody = body.replace(/<[^>]*>/g, ' ');
  
  // Look for capitalized business names (common pattern)
  const businessNameMatch = textBody.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/);
  return businessNameMatch ? businessNameMatch[0] : null;
}

// Get unread email count for a business
export function getUnreadEmailCount(businessId: string): number {
  const threads = loadEmailThreads();
  const thread = threads.find(t => t.businessId === businessId);
  
  if (!thread) return 0;
  
  // Count received emails that haven't been marked as read
  // For now, we'll count all received emails as potentially unread
  return thread.emails.filter((email: { direction: string }) => email.direction === 'received').length;
}

// Mark emails as read for a business
export function markEmailsAsRead(businessId: string): void {
  // This would typically update a database
  // For now, we'll just log that emails were marked as read
  console.log(`Marking emails as read for business: ${businessId}`);
}

// Get email thread for a specific business
export function getEmailThread(businessId: string): EmailThread | null {
  const threads = loadEmailThreads();
  return threads.find(thread => thread.businessId === businessId) || null;
} 