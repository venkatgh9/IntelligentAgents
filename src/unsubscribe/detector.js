import * as cheerio from 'cheerio';

/**
 * Extract unsubscribe links from email
 */
export function findUnsubscribeLinks(email) {
  const links = [];
  
  // Check List-Unsubscribe header (RFC 2369)
  if (email.listUnsubscribe) {
    const headerLinks = email.listUnsubscribe
      .split(',')
      .map(link => link.trim())
      .filter(link => link.startsWith('<') && link.endsWith('>'))
      .map(link => link.slice(1, -1));
    
    links.push(...headerLinks.map(url => ({
      type: 'header',
      url,
      method: 'http',
    })));
  }

  // Check List-Unsubscribe-Post header (RFC 8058)
  if (email.listUnsubscribePost) {
    links.push({
      type: 'header',
      url: email.listUnsubscribe,
      method: 'post',
    });
  }

  // Extract from HTML body
  if (email.htmlBody) {
    const $ = cheerio.load(email.htmlBody);
    
    // Find unsubscribe links in HTML
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().toLowerCase();
      
      if (href && (
        text.includes('unsubscribe') ||
        text.includes('opt out') ||
        text.includes('preferences') ||
        href.includes('unsubscribe') ||
        href.includes('optout')
      )) {
        links.push({
          type: 'html',
          url: href,
          method: 'link',
          text: text.trim(),
        });
      }
    });
  }

  // Extract from plain text body
  if (email.body) {
    const unsubscribeRegex = /(?:https?:\/\/[^\s]+(?:unsubscribe|optout|preferences)[^\s]*)/gi;
    const matches = email.body.match(unsubscribeRegex);
    
    if (matches) {
      matches.forEach(url => {
        links.push({
          type: 'text',
          url,
          method: 'link',
        });
      });
    }
  }

  return links;
}

/**
 * Validate unsubscribe link
 */
export function isValidUnsubscribeLink(link) {
  if (!link.url) return false;
  
  // Must be HTTP/HTTPS
  if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
    return false;
  }

  // Avoid suspicious domains
  const suspiciousPatterns = [
    /bit\.ly/i,
    /tinyurl/i,
    /goo\.gl/i,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(link.url))) {
    return false; // Could be phishing
  }

  return true;
}

