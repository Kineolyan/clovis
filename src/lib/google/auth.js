const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = '.secret/token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, scopes) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  return new Promise((resolve, reject) => {
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) { 
        return getNewToken(oAuth2Client, scopes).then(
          (client) => resolve(client),
          (err) => reject(err)); 
      } else {
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
      }
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, scopes) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) { 
          console.error('Error while trying to retrieve access token', err);
          reject(err);
        } else {
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) {
              reject(err);
            } else {
              console.log('Token stored to', TOKEN_PATH);
              resolve(oAuth2Client);
            }
          });
        }
      });
    });
  });
}

/**
 * Creates a function providing authentication.
 * @param {string[]} scopes list of scopes of the application
 * @returns {Promise} promise of the auth object
 */
const createTokenAuthentication = (scopes) => {
  const auth = new Promise((resolve, reject) => {
    // Load client secrets from a local file.
    fs.readFile(process.env.GOOGLE_CREDENTIALS, (err, content) => {
      if (err) { 
        console.log('Error loading client secret file:', err); 
        reject(err);
      } else {
        resolve(JSON.parse(content));
      }
    });
  })
  .then(credentials => authorize(credentials, scopes));

  return () => auth;
};

const createServiceAuthentication = (scopes) => {
  const auth = google.auth.getClient({
    scopes
  })
  .catch(err => {
    console.error('Cannot use file to authenticate', err);
    throw err;
  });

  return () => auth;
};

module.exports = {
  createTokenAuthentication,
  createServiceAuthentication
};
