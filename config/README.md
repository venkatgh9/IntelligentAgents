# Configuration Directory

This directory contains configuration files for the Gmail Unsubscribe Agent.

## Required Files

### `credentials.json`
OAuth 2.0 credentials from Google Cloud Console. 

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop app or Web application)
5. Download and save as `credentials.json` here

**Note:** This file is gitignored for security. Do not commit it to version control.

### `token.json`
OAuth token file created automatically after first authentication. This file is gitignored.

### `whitelist.json`
Whitelist configuration file created automatically on first run. Edit this file to add domains/emails that should never be unsubscribed.

**Example:**
```json
{
  "domains": [
    "important-company.com",
    "my-bank.com"
  ],
  "emails": [
    "important@example.com"
  ],
  "patterns": [
    ".*@bank\\.com"
  ]
}
```

**Note:** This file is gitignored. Create it manually or let the app create it on first run.

