const {createTokenAuthentication} = require('./google/auth.js');
const {SCOPES, recordActivity} = require('./google/ping.js');

const authProvider = createTokenAuthentication(SCOPES);

authProvider()
  .then(client => recordActivity(client));
