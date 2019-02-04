// @ts-check
const auth = require('./google/auth.js');
const ping = require('./google/ping.js');

// const authProvider = auth.createTokenAuthentication(SCOPES);
const authProvider = auth.createServiceAuthentication(ping.SCOPES);

// authProvider()
//   .then(client => ping.recordActivity(client));
authProvider()
  .then(client => ping.checkActivity(client));
