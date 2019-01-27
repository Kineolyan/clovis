const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
  // 'https://www.googleapis.com/auth/spreadsheets.readonly'
  'https://www.googleapis.com/auth/spreadsheets'
];

const manualDbSheetId = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';
/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function recordActivity(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: manualDbSheetId,
    range: 'System!C1:C1',
  }, (err, res) => {
    if (err) { return console.log('The API returned an error: ' + err); }
    const rows = res.data.values;
    if (rows.length > 0) {
      console.log(`Last connection at ${rows[0][0]}`);
      const now = new Date();
      sheets.spreadsheets.values.update({
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
          } else {
            console.log('Write succesful!');
          }
        })
    } else {
      console.log('No data found.');
    }
  });
}

module.exports = {
  SCOPES,
  recordActivity
};
