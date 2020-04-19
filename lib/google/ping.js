// @ts-check
const {google} = require('googleapis');

const config = require('./config.js');
const {sendMail} = require('./mail.js');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

const manualDbSheetId = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';

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

const readCurrentTime = (api) => readTime(api, config.getPingRange());
const writeCurrentTime = (api) => writeTime(api, config.getPingRange());

const notifyAlert = () => {
  console.log('alert. there is something wrong');
  return sendMail(
  {
    originator: 'kineolyan+jarvis@gmail.com',
    destinators: ['kineolyan@protonmail.com'],
    subject: '[Alert] House is down',
    body: 'Oops. Pb à la maison...'
  });
};
const notifyResolution = () => {
  console.log('resolved');
  return sendMail({
    originator: 'kineolyan+jarvis@gmail.com',
    destinators: ['kineolyan@protonmail.com'],
    subject: '[Phew!] House is up',
    body: 'Aahh. Retour de la vie informatique :)'
  });
};

const readAlertTime = (api) => readTime(api, config.getAlertRange());
const writeAlertTime = (api) => writeTime(api, config.getAlertRange());
const resetAlertTime = (api) => writeTime(api, config.getAlertRange(), null);

const DOWN_TIME = 10 /* minutes */ * 60 /* seconds */ * 1000;
function isHomeDown(lastTime) {
  const duration = Date.now() - lastTime;
  return duration >= DOWN_TIME;
}

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
