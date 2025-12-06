import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Gmail API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

/**
 * Load credentials from file
 */
async function loadCredentials() {
  const credentialsPath = path.join(__dirname, '../../config/credentials.json');
  const content = await fs.readFile(credentialsPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load or create token
 */
async function loadToken() {
  const tokenPath = path.join(__dirname, '../../config/token.json');
  try {
    const content = await fs.readFile(tokenPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Save token to file
 */
async function saveToken(token) {
  const tokenPath = path.join(__dirname, '../../config/token.json');
  await fs.writeFile(tokenPath, JSON.stringify(token, null, 2));
}

/**
 * Get OAuth2 client
 */
export async function getAuthClient() {
  const credentials = await loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token
  const token = await loadToken();
  if (token) {
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Get new token
  return getNewToken(oAuth2Client);
}

/**
 * Get and store new token after prompting for user authorization
 */
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n🔐 Authorization required!');
  console.log('Authorize this app by visiting this url:');
  console.log(authUrl);
  console.log('\nAfter authorization, you will be redirected to a page.');
  console.log('Copy the "code" parameter from the URL and paste it below.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the authorization code: ', async (code) => {
      rl.close();
      
      try {
        const { tokens } = await oAuth2Client.getToken(code.trim());
        oAuth2Client.setCredentials(tokens);
        await saveToken(tokens);
        console.log('✅ Token stored successfully!\n');
        resolve(oAuth2Client);
      } catch (error) {
        reject(new Error(`Failed to get token: ${error.message}`));
      }
    });
  });
}

/**
 * Initialize Gmail API client
 */
export async function initializeGmail() {
  const auth = await getAuthClient();
  return google.gmail({ version: 'v1', auth });
}

