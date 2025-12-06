import { initializeGmail } from './auth.js';

let gmailClient = null;

/**
 * Get Gmail API client (singleton)
 */
export async function getGmailClient() {
  if (!gmailClient) {
    gmailClient = await initializeGmail();
  }
  return gmailClient;
}

/**
 * List messages matching a query
 */
export async function listMessages(query = 'is:unread category:promotions', maxResults = 50) {
  const gmail = await getGmailClient();
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults,
  });

  return response.data.messages || [];
}

/**
 * Get full message details
 */
export async function getMessage(messageId) {
  const gmail = await getGmailClient();
  
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  return response.data;
}

/**
 * Parse email content
 */
export function parseEmail(message) {
  const headers = message.payload.headers;
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;

  const subject = getHeader('Subject');
  const from = getHeader('From');
  const to = getHeader('To');
  const date = getHeader('Date');
  const listUnsubscribe = getHeader('List-Unsubscribe');
  const listUnsubscribePost = getHeader('List-Unsubscribe-Post');

  // Extract body
  let body = '';
  let htmlBody = '';

  const extractBody = (part) => {
    if (part.body?.data) {
      const text = Buffer.from(part.body.data, 'base64').toString('utf-8');
      if (part.mimeType === 'text/plain') {
        body += text;
      } else if (part.mimeType === 'text/html') {
        htmlBody += text;
      }
    }
    if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };

  extractBody(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    from,
    to,
    date,
    body,
    htmlBody,
    listUnsubscribe,
    listUnsubscribePost,
    snippet: message.snippet,
  };
}

/**
 * Batch get messages
 */
export async function getMessages(messageIds) {
  const messages = await Promise.all(
    messageIds.map(id => getMessage(id))
  );
  return messages.map(parseEmail);
}

