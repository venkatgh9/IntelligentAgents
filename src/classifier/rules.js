/**
 * Rule-based email classification
 * Fast and doesn't require API calls
 */

const MARKETING_KEYWORDS = [
  'unsubscribe',
  'marketing',
  'promotion',
  'sale',
  'discount',
  'offer',
  'deal',
  'newsletter',
  'update your preferences',
  'email preferences',
  'manage subscription',
];

const MARKETING_SENDER_PATTERNS = [
  /noreply@/i,
  /no-reply@/i,
  /marketing@/i,
  /newsletter@/i,
  /promo@/i,
  /deals@/i,
];

/**
 * Check if email contains marketing keywords
 */
function hasMarketingKeywords(email) {
  const text = `${email.subject} ${email.body} ${email.snippet}`.toLowerCase();
  return MARKETING_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * Check if sender matches marketing patterns
 */
function hasMarketingSender(email) {
  const from = email.from?.toLowerCase() || '';
  return MARKETING_SENDER_PATTERNS.some(pattern => pattern.test(from));
}

/**
 * Check if email has unsubscribe header
 */
function hasUnsubscribeHeader(email) {
  return !!(email.listUnsubscribe || email.listUnsubscribePost);
}

/**
 * Rule-based classification
 */
export function classifyEmail(email) {
  let score = 0;
  const reasons = [];

  if (hasMarketingKeywords(email)) {
    score += 0.4;
    reasons.push('Contains marketing keywords');
  }

  if (hasMarketingSender(email)) {
    score += 0.3;
    reasons.push('Sender matches marketing pattern');
  }

  if (hasUnsubscribeHeader(email)) {
    score += 0.3;
    reasons.push('Has unsubscribe header');
  }

  const isMarketing = score >= 0.5;
  const confidence = Math.min(score, 1.0);

  return {
    isMarketing,
    confidence,
    reason: reasons.join('; ') || 'No marketing indicators found',
    shouldUnsubscribe: isMarketing && confidence >= 0.6,
  };
}

/**
 * Batch classify emails
 */
export function classifyEmails(emails) {
  return emails.map(email => ({
    email,
    classification: classifyEmail(email),
  }));
}

