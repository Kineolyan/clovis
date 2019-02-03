const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
  // 'https://www.googleapis.com/auth/spreadsheets.readonly'
  'https://www.googleapis.com/auth/spreadsheets'
];

const manualDbSheetId = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';

const PING_RANGE = 'System!B1:C1';
const ALERT_RANGE = 'System!B2:C2';
const readTime = (api, range) => new Promise((resolve, reject) => {
  api.spreadsheets.values.get(
    {
      spreadsheetId: manualDbSheetId,
      range,
    },
    (err, res) => {
      if (err) { 
        console.error('The API returned an error: ' + err); 
        reject(err);
      } else {
        const rows = res.data.values;
        if (rows.length > 0) {
          resolve({
            time: rows[0][0],
            date: rows[0][1]
          });
        } else {
          resolve(null);
        }
      }
    });
});
const writeTime = (api, range, now = new Date()) => new Promise((resolve, reject) => {
  const values = now === null
    ? ['', '']
    : [
      now.getTime(),
      `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
    ];
  api.spreadsheets.values.update(
    {
      spreadsheetId: manualDbSheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        "range": range,
        "values": [values]
      }
    },
    (err) => {
      if (err) { 
        console.error('Cannot write data ' + err); 
        reject(err);
      } else {
        console.log('Write successful!');
        resolve();
      }
    });
});

const readCurrentTime = (api) => readTime(api, PING_RANGE);
const writeCurrentTime = (api) => writeTime(api, PING_TIME);

const notifyMe = (api) => new Promise((resolve, reject) => {
  resolve();
});

const readAlertTime = (api) => readTime(api, ALERT_RANGE);
const writeAlertTime = (api) => writeTime(api, ALERT_RANGE);
const resetAlertTime = (api) => writeTime(api, ALERT_RANGE, null);

const DOWN_TIME = 60 /* minutes */ * 60 /* seconds */ * 1000;
const isHomeDown = lastTime => {
  const duration = Date.now() - lastTime;
  return duration >= DOWN_TIME;
};

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function recordActivity(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  return writeCurrentTime(sheets);
}

function checkActivity(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  return Promise.all([
    readCurrentTime(sheets),
    readAlertTime(sheets)
  ])
    .then(([pingTime, alertTime]) => {
      if (pingTime !== null) {
        console.log(`Last connection at ${pingTime.date}`);
        const isDown = isHomeDown(pingTime.time);
        if (isDown && alertTime === null) {
          // New alert, notify and register our action
          return notifyMe()
            .then(() => writeAlertTime(sheets));
        } else if (!isDown && alert !== null) {
          return resetAlertTime(sheets);
        }
      } else {
        console.log('No data recorded yet.');
      }
    });
}

module.exports = {
  SCOPES,
  recordActivity,
  checkActivity
};
