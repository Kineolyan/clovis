const {
  handleWithSecret, 
  makeTextResponse
} = require('./meta.js');
const {createServiceAuthentication} = require('../google/auth.js');
const mPing = require('../google/ping');

const pingProvider = createServiceAuthentication(mPing.SCOPES);

function ping(event, context, callback) {
  handleWithSecret(
    {event, callback},
    {
      read: payload => payload.event.queryStringParameters.soni,
      get: () => 'present'
    },
    ({callback}) => {
      pingProvider()
        .then(client => mPing.recordActivity(client))
        .then(() => {
          const response = makeTextResponse({body: 'Done'});
          callback(null, response);
      });
    });
};

function check(event, context, callback) {
  pingProvider()
    .then(client => mPing.checkActivity(client))
    .then(() => callback(
      null, 
      makeTextResponse({body: 'Check done'})));
}

module.exports = {
  ping,
  check
};
