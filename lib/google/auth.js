const {google} = require('googleapis');

const createServiceAuthentication = (scopes) => {
  const auth = google.auth.getClient({
    scopes
  })
  .catch(err => {
    console.error('Cannot use file to authenticate', err);
    throw err;
  });

  return () => auth;
};

module.exports = {
  createServiceAuthentication
};
