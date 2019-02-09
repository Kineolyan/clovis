// @ts-check
const {google} = require('googleapis');

const {sendMail} = require('./mail.js');

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

const manualDbSheetId = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';

const ALL_RANGES = {
  prod: {
    ping: 'System!B1:C1',
    alert: 'System!B2:C2' 
  },
  dev: {
    ping: 'System!B3:C3',
    alert: 'System!B4:C4'
  }
};
const RANGES  = ALL_RANGES[process.env.STAGE];

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
        if (rows !== undefined && rows.length > 0) {
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

const readCurrentTime = (api) => readTime(api, RANGES.ping);
const writeCurrentTime = (api) => writeTime(api, RANGES.ping);

const notifyAlert = () => {
  console.log('alert. there is something wrong');
  return sendMail(
  {
    originator: 'kineolyan+jarvis@gmail.com',
    destinators: ['kineolyan@gmail.com'],
    subject: '[Alert] House is down',
    body: 'Oops. Pb à la maison...'
  });
};
const notifyResolution = () => {
  console.log('resolved');
  return sendMail({
    originator: 'kineolyan+jarvis@gmail.com',
    destinators: ['kineolyan@gmail.com'],
    subject: '[Phew!] House is up',
    body: 'Aahh. Retour de la vie informatique :)'
  });
};

const readAlertTime = (api) => readTime(api, RANGES.alert);
const writeAlertTime = (api) => writeTime(api, RANGES.alert);
const resetAlertTime = (api) => writeTime(api, RANGES.alert, null);

const DOWN_TIME = 10 /* minutes */ * 60 /* seconds */ * 1000;
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
          return notifyAlert()
            .then(() => writeAlertTime(sheets));
        } else if (!isDown && alertTime !== null) {
          return notifyResolution()
            .then(() => resetAlertTime(sheets));
        } else {
          console.log(`Nothing to do. State: ${isDown ? 'down' : 'up'}`);
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
