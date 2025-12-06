import { isWhitelisted } from './whitelist.js';

/**
 * Validate if it's safe to unsubscribe from an email
 */
export async function validateUnsubscribe(email, classification) {
  const issues = [];
  const warnings = [];

  // Check whitelist
  const whitelisted = await isWhitelisted(email);
  if (whitelisted) {
    issues.push('Email is whitelisted');
  }

  // Check confidence
  if (classification.confidence < 0.7) {
    warnings.push(`Low confidence (${classification.confidence})`);
  }

  // Check if it's a transactional email
  const transactionalKeywords = [
    'receipt',
    'invoice',
    'order confirmation',
    'shipping',
    'delivery',
    'password reset',
    'verification',
    'account',
  ];
  
  const subjectBody = `${email.subject} ${email.snippet}`.toLowerCase();
  if (transactionalKeywords.some(keyword => subjectBody.includes(keyword))) {
    warnings.push('May be a transactional email');
  }

  // Check if from important domains
  const importantDomains = [
    'bank',
    'paypal',
    'amazon',
    'apple',
    'microsoft',
    'google',
  ];
  
  const fromDomain = email.from?.toLowerCase() || '';
  if (importantDomains.some(domain => fromDomain.includes(domain))) {
    warnings.push('From potentially important sender');
  }

  return {
    safe: issues.length === 0,
    issues,
    warnings,
    shouldProceed: issues.length === 0 && classification.shouldUnsubscribe,
  };
}

