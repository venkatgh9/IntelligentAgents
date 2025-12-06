import dotenv from 'dotenv';
import { listMessages, getMessages } from './gmail/client.js';
import { classifyEmails as classifyWithRules } from './classifier/rules.js';
import { classifyEmails as classifyWithAI } from './classifier/aiClassifier.js';
import { unsubscribeFromEmail } from './unsubscribe/executor.js';
import { validateUnsubscribe } from './safety/validator.js';
import { addToWhitelist } from './safety/whitelist.js';

dotenv.config();

// Configuration
const CONFIG = {
  dryRun: process.env.DRY_RUN === 'true' || true, // Start with dry run
  useAI: process.env.USE_AI === 'true',
  maxEmails: parseInt(process.env.MAX_EMAILS || '50'),
  minConfidence: parseFloat(process.env.MIN_CONFIDENCE || '0.7'),
  query: process.env.GMAIL_QUERY || 'is:unread category:promotions',
};

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Gmail Unsubscribe Agent Starting...');
  console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Classification: ${CONFIG.useAI ? 'AI' : 'Rule-based'}`);
  console.log('');

  try {
    // 1. Fetch emails
    console.log('📧 Fetching emails...');
    const messageIds = await listMessages(CONFIG.query, CONFIG.maxEmails);
    console.log(`Found ${messageIds.length} messages`);

    if (messageIds.length === 0) {
      console.log('No emails to process');
      return;
    }

    // 2. Get full email details
    console.log('📥 Loading email details...');
    const emails = await getMessages(messageIds.map(m => m.id));
    console.log(`Loaded ${emails.length} emails`);

    // 3. Classify emails
    console.log('🤖 Classifying emails...');
    const classifications = CONFIG.useAI
      ? await classifyWithAI(emails)
      : classifyWithRules(emails);

    // 4. Filter and validate
    console.log('✅ Validating emails...');
    const candidates = [];
    
    for (const { email, classification } of classifications) {
      if (classification.isMarketing && classification.confidence >= CONFIG.minConfidence) {
        const validation = await validateUnsubscribe(email, classification);
        
        if (validation.shouldProceed) {
          candidates.push({
            email,
            classification,
            validation,
          });
        } else {
          console.log(`⚠️  Skipping: ${email.from} - ${validation.issues.join(', ')}`);
        }
      }
    }

    console.log(`\n📊 Found ${candidates.length} emails to unsubscribe from\n`);

    // 5. Process unsubscribes
    const results = [];
    for (const candidate of candidates) {
      console.log(`Processing: ${candidate.email.from}`);
      console.log(`  Subject: ${candidate.email.subject}`);
      console.log(`  Confidence: ${(candidate.classification.confidence * 100).toFixed(1)}%`);
      
      const result = await unsubscribeFromEmail(candidate.email, CONFIG.dryRun);
      results.push({
        email: candidate.email,
        result,
      });

      if (result.success) {
        console.log(`  ✅ ${CONFIG.dryRun ? 'Would unsubscribe' : 'Unsubscribed'}`);
      } else {
        console.log(`  ❌ Failed: ${result.reason}`);
      }
      console.log('');
    }

    // 6. Summary
    console.log('\n📈 Summary:');
    console.log(`Total emails processed: ${emails.length}`);
    console.log(`Marketing emails found: ${candidates.length}`);
    console.log(`Successful unsubscribes: ${results.filter(r => r.result.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.result.success).length}`);

    if (CONFIG.dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No emails were actually unsubscribed.');
      console.log('Set DRY_RUN=false in .env to enable live mode.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };

