import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WHITELIST_PATH = path.join(__dirname, '../../config/whitelist.json');

/**
 * Load whitelist from file
 */
export async function loadWhitelist() {
  try {
    const content = await fs.readFile(WHITELIST_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Create default whitelist
    const defaultWhitelist = {
      domains: [
        'gmail.com',
        'google.com',
        'github.com',
        'linkedin.com',
      ],
      emails: [],
      patterns: [],
    };
    await saveWhitelist(defaultWhitelist);
    return defaultWhitelist;
  }
}

/**
 * Save whitelist to file
 */
export async function saveWhitelist(whitelist) {
  await fs.writeFile(WHITELIST_PATH, JSON.stringify(whitelist, null, 2));
}

/**
 * Check if email is whitelisted
 */
export async function isWhitelisted(email) {
  const whitelist = await loadWhitelist();
  const fromEmail = email.from?.toLowerCase() || '';
  
  // Extract domain
  const domainMatch = fromEmail.match(/@([^\s>]+)/);
  const domain = domainMatch ? domainMatch[1] : '';
  
  // Check exact email
  if (whitelist.emails.some(e => fromEmail.includes(e.toLowerCase()))) {
    return true;
  }
  
  // Check domain
  if (whitelist.domains.some(d => domain.includes(d.toLowerCase()))) {
    return true;
  }
  
  // Check patterns
  if (whitelist.patterns.some(pattern => {
    const regex = new RegExp(pattern, 'i');
    return regex.test(fromEmail) || regex.test(domain);
  })) {
    return true;
  }
  
  return false;
}

/**
 * Add to whitelist
 */
export async function addToWhitelist(emailOrDomain) {
  const whitelist = await loadWhitelist();
  
  if (emailOrDomain.includes('@')) {
    if (!whitelist.emails.includes(emailOrDomain)) {
      whitelist.emails.push(emailOrDomain);
    }
  } else {
    if (!whitelist.domains.includes(emailOrDomain)) {
      whitelist.domains.push(emailOrDomain);
    }
  }
  
  await saveWhitelist(whitelist);
}

