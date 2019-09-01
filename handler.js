const {createServiceAuthentication} = require('./google/auth.js');
const mPing = require('./google/ping.js');
const mSerie = require('./google/serie.js');

const pingProvider = createServiceAuthentication(mPing.SCOPES);
const serieProvider = createServiceAuthentication(mSerie.SCOPES);

function hello(event, context, callback) {
  console.log(event); // Contains incoming request data (e.g., query params, headers and more)

  const response = {
    statusCode: 200,
    headers: {
      "x-custom-header" : "My Header Value"
    },
    body: JSON.stringify({ "message": "Hello World!" })
  };

  callback(null, response);
};

function ping(event, context, callback) {
  const {soni} = event.queryStringParameters;
  if (soni === 'present') {
    // Record the ping to Google Sheet
    pingProvider()
      .then(client => mPing.recordActivity(client))
      .then(() => {
        const response = {
          statusCode: 200,
          body: 'Done',
          headers: {
            "Content-Type":
            "text/plain"
          }
        };
        callback(null, response);
      });
  } else {
    callback(
      null,
      {
        statusCode: 501,
        body: "Not found",
        headers: {
          "Content-Type": "text/plain"
        }
      });
  }
};

function check(event, context, callback) {
  pingProvider()
    .then(client => mPing.checkActivity(client))
    .then(() => callback(null, 'Check done'));
}

function listSeries(event, context, callback) {
  serieProvider()
    .then(client => mSerie.readSeries(client))
    .then(data => {
      const response = {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json"
        }
      };
      callback(null, response);
    });
};

function watchSerie(event, context, callback) {
  const {secret} = event.queryStringParameters;
  if (secret === 'username') {
    // Record the ping to Google Sheet
    const {id} =  event.pathParameters;
    if (id !== undefined) {
      const episode = event.body;
      pingProvider()
        .then(client => mSerie.recordWatchedEpisode(client, id, episode))
        .then(() => {
          const response = {
            statusCode: 200,
            body: 'Done',
            headers: {
              "Content-Type": "text/plain"
            }
          };
          callback(null, response);
        });
    } else {
      callback(
        null,
        {
          statusCode: 400,
          body: `No row provided`,
          headers: {
            "Content-Type": "text/plain"
          }
        }
      )
    }
  } else {
    callback(
      null,
      {
        statusCode: 501,
        body: "Not found",
        headers: {
          "Content-Type": "text/plain"
        }
      });
  }
};

module.exports = {
  hello,
  ping,
  check,
  listSeries,
  watchSerie
};
