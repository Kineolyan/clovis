const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
  // 'https://www.googleapis.com/auth/spreadsheets.readonly'
  'https://www.googleapis.com/auth/spreadsheets'
];

const manualDbSheetId = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';

const readCurrentTime = (api) => new Promise((resolve, reject) => {
  api.spreadsheets.values.get(
    {
      spreadsheetId: manualDbSheetId,
      range: 'System!C1:C1',
    },
    (err, res) => {
      if (err) { 
        console.error('The API returned an error: ' + err); 
        reject(err);
      } else {
        resolve(res);
      }
    });
});

const writeCurrentTime = (api) => new Promise((resolve, reject) => {
  const now = new Date();
  api.spreadsheets.values.update(
    {
      spreadsheetId: manualDbSheetId,
      range: 'System!B1:C1',
      valueInputOption: 'RAW',
      resource: {
        "range": "System!B1:C1",
        "values": [
          [
            now.getTime(),
            `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
          ]
        ]
      }
    },
    (err) => {
      if (err) { 
        console.error('Cannot write data ' + err); 
        reject(err);
      } else {
        console.log('Write succesful!');
        resolve();
      }
    });
});

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function recordActivity(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  return readCurrentTime(sheets)
    .then(res => {
      const rows = res.data.values;
      if (rows.length > 0) {
        console.log(`Last connection at ${rows[0][0]}`);
        return writeCurrentTime(sheets);
      } else {
        console.log('No data found.');
      }
    });
}

module.exports = {
  SCOPES,
  recordActivity
};
