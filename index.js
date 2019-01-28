const auth = require('./google/auth.js');
const {SCOPES, recordActivity} = require('./google/ping.js');

// const authProvider = auth.createTokenAuthentication(SCOPES);
const authProvider = auth.createServiceAuthentication(SCOPES);

authProvider()
  .then(client => recordActivity(client));
