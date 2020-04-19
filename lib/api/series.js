// @ts-check
const {
  handleWithSecret, 
  makeJsonResponse,
  makeTextResponse
} = require('./meta.js');
const {createServiceAuthentication} = require('../google/auth.js');
const mSerie = require('../google/serie.js');

const provider = createServiceAuthentication(mSerie.SCOPES);

function listSeries(event, context, callback) {
  provider()
    .then(client => mSerie.readSeries(client))
    .then(data => {
      const response = makeJsonResponse({body: data});
      callback(null, response);
    });
};

function watchSerie(event, context, callback) {
  handleWithSecret(
    {event, callback},
    {
      read: payload => payload.event.queryStringParameters.secret,
      get: () => 'username'
    },
    ({event, callback}) => {
      const id = parseInt(event.pathParameters.id, 10);
      if (id !== undefined) {
        const episode = parseInt(JSON.parse(event.body), 10);
        console.log('id', id, 'ep.', episode);
        provider()
          .then(client => mSerie.recordWatchedEpisode(client, id, episode))
          .then(() => {
            const response = makeTextResponse({body: 'Done'});
            callback(null, response);
          });
      } else {
        callback(
          null,
          makeTextResponse({
            code: 400,
            body: `No row provided`
          }));
      }
    }
  );
};

module.exports = {
  listSeries,
  watchSerie
};
