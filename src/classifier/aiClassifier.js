import OpenAI from 'openai';

let openai = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for AI classification');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Classify email as marketing/promotional using AI
 */
export async function classifyEmail(email) {
  const prompt = `Analyze this email and determine if it's a marketing or promotional email that the user might want to unsubscribe from.

Email Details:
From: ${email.from}
Subject: ${email.subject}
Snippet: ${email.snippet}

Respond with JSON:
{
  "isMarketing": boolean,
  "confidence": number (0-1),
  "reason": "brief explanation",
  "shouldUnsubscribe": boolean}`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-3.5-turbo' for cost savings
      messages: [
        {
          role: 'system',
          content: 'You are an email classification assistant. Analyze emails to identify marketing and promotional content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      isMarketing: result.isMarketing || false,
      confidence: result.confidence || 0,
      reason: result.reason || '',
      shouldUnsubscribe: result.shouldUnsubscribe || false,
    };
  } catch (error) {
    console.error('AI classification error:', error);
    // Fallback to rule-based
    return {
      isMarketing: false,
      confidence: 0,
      reason: 'AI classification failed',
      shouldUnsubscribe: false,
    };
  }
}

/**
 * Batch classify emails
 */
export async function classifyEmails(emails) {
  const results = await Promise.all(
    emails.map(async (email) => ({
      email,
      classification: await classifyEmail(email),
    }))
  );
  return results;
}

