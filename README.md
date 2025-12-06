# Gmail AI Unsubscribe Agent

An intelligent agent that automatically identifies and unsubscribes from marketing and promotional emails in your Gmail account.

## Features

- 🤖 **AI-Powered Classification** - Uses OpenAI to identify marketing emails
- 📋 **Rule-Based Fallback** - Fast keyword-based classification
- 🔒 **Safety First** - Whitelist, validation, and dry-run mode
- 🔗 **Multiple Unsubscribe Methods** - Supports List-Unsubscribe headers and link extraction
- 📊 **Detailed Logging** - Track all actions and decisions

## Prerequisites

1. **Node.js** 18+ installed
2. **Google Cloud Project** with Gmail API enabled
3. **OAuth 2.0 Credentials** from Google Cloud Console
4. (Optional) **OpenAI API Key** for AI classification

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Gmail API"
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Desktop app" or "Web application"
   - Download credentials JSON
5. Save credentials as `config/credentials.json`

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Initial Authentication

Run the agent once to authenticate:

```bash
npm start
```

Follow the prompts to authorize the app. The token will be saved automatically.

## Usage

### Dry Run (Recommended First)

```bash
# .env: DRY_RUN=true
npm start
```

This will show what would be unsubscribed without actually doing it.

### Live Mode

```bash
# .env: DRY_RUN=false
npm start
```

### Custom Gmail Query

Edit `.env` to customize which emails to process:

```env
GMAIL_QUERY=is:unread category:promotions newer_than:7d
```

## Configuration

### Environment Variables

- `DRY_RUN` - Set to `true` to test without unsubscribing (default: `true`)
- `USE_AI` - Use AI classification instead of rules (default: `false`)
- `MAX_EMAILS` - Maximum emails to process per run (default: `50`)
- `MIN_CONFIDENCE` - Minimum confidence to unsubscribe (default: `0.7`)
- `GMAIL_QUERY` - Gmail search query (default: `is:unread category:promotions`)
- `OPENAI_API_KEY` - Required if `USE_AI=true`

## Safety Features

### Whitelist

Edit `config/whitelist.json` to add domains/emails that should never be unsubscribed:

```json
{
  "domains": ["important-company.com"],
  "emails": ["important@example.com"],
  "patterns": [".*@bank\\.com"]
}
```

### Validation

The agent automatically:
- Checks whitelist
- Validates confidence scores
- Warns about transactional emails
- Flags important senders

## Unsubscribe Methods

1. **List-Unsubscribe Header** (RFC 2369) - One-click HTTP unsubscribe
2. **List-Unsubscribe-Post** (RFC 8058) - POST-based unsubscribe
3. **Link Extraction** - Finds unsubscribe links in email body
4. **Browser Automation** - Uses Puppeteer for complex unsubscribe flows

## Project Structure

```
gmail-unsubscribe-agent/
├── src/
│   ├── gmail/          # Gmail API integration
│   ├── classifier/     # Email classification
│   ├── unsubscribe/     # Unsubscribe logic
│   ├── safety/         # Safety features
│   └── index.js        # Main entry point
├── config/             # Configuration files
└── package.json
```

## Legal & Ethical Considerations

⚠️ **Important:**
- Only use on your own email account
- Respect CAN-SPAM Act and GDPR
- Review before unsubscribing from important services
- Some services require manual unsubscribe
- Test thoroughly in dry-run mode first

## Troubleshooting

### Authentication Issues
- Ensure `config/credentials.json` is properly formatted
- Delete `config/token.json` and re-authenticate
- Check OAuth scopes are correct

### Classification Issues
- Try rule-based mode first (`USE_AI=false`)
- Adjust `MIN_CONFIDENCE` threshold
- Review whitelist settings

### Unsubscribe Failures
- Some services require manual unsubscribe
- Check logs for specific error messages
- Verify unsubscribe links are accessible

## License

MIT

