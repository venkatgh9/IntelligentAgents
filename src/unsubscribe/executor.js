import puppeteer from 'puppeteer';
import { findUnsubscribeLinks, isValidUnsubscribeLink } from './detector.js';

/**
 * Execute HTTP GET unsubscribe
 */
async function unsubscribeViaGet(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UnsubscribeBot/1.0)',
      },
    });
    
    return {
      success: response.ok,
      status: response.status,
      method: 'GET',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      method: 'GET',
    };
  }
}

/**
 * Execute HTTP POST unsubscribe
 */
async function unsubscribeViaPost(url, email) {
  try {
    // Extract email from List-Unsubscribe-Post format
    const emailAddress = email.to || email.from;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; UnsubscribeBot/1.0)',
      },
      body: new URLSearchParams({
        email: emailAddress,
      }),
    });
    
    return {
      success: response.ok,
      status: response.status,
      method: 'POST',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      method: 'POST',
    };
  }
}

/**
 * Execute link-based unsubscribe using browser automation
 */
async function unsubscribeViaLink(url, email) {
  let browser = null;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Try to find and click unsubscribe button
    const unsubscribeSelectors = [
      'button:contains("Unsubscribe")',
      'a:contains("Unsubscribe")',
      '[data-action="unsubscribe"]',
      'form[action*="unsubscribe"] button[type="submit"]',
    ];
    
    let clicked = false;
    for (const selector of unsubscribeSelectors) {
      try {
        await page.click(selector, { timeout: 5000 });
        clicked = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (clicked) {
      await page.waitForTimeout(2000); // Wait for confirmation
    }
    
    const finalUrl = page.url();
    await browser.close();
    
    return {
      success: clicked || finalUrl.includes('unsubscribe'),
      method: 'link',
      finalUrl,
    };
  } catch (error) {
    if (browser) await browser.close();
    return {
      success: false,
      error: error.message,
      method: 'link',
    };
  }
}

/**
 * Execute unsubscribe for an email
 */
export async function unsubscribeFromEmail(email, dryRun = true) {
  const links = findUnsubscribeLinks(email);
  const validLinks = links.filter(isValidUnsubscribeLink);
  
  if (validLinks.length === 0) {
    return {
      success: false,
      reason: 'No valid unsubscribe links found',
      links: [],
    };
  }

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      links: validLinks,
      message: 'DRY RUN: Would unsubscribe using these links',
    };
  }

  // Try each link method
  const results = [];
  
  for (const link of validLinks) {
    let result;
    
    if (link.method === 'http' && link.type === 'header') {
      result = await unsubscribeViaGet(link.url);
    } else if (link.method === 'post') {
      result = await unsubscribeViaPost(link.url, email);
    } else if (link.method === 'link') {
      result = await unsubscribeViaLink(link.url, email);
    }
    
    results.push({ link, result });
    
    // If one succeeds, we're done
    if (result.success) {
      return {
        success: true,
        method: result.method,
        links: validLinks,
        results,
      };
    }
  }

  return {
    success: false,
    reason: 'All unsubscribe attempts failed',
    links: validLinks,
    results,
  };
}

