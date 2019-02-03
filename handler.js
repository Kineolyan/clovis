const {createServiceAuthentication} = require('./google/auth.js');
const ping = require('./google/ping.js');

const authProvider = createServiceAuthentication(ping,SCOPES);

const hello = (event, context, callback) => {
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

const ping = (event, context, callback) => {
  const {soni} = event.queryStringParameters;
  if (soni === 'present') {
    // Record the ping to Google Sheet
    authProvider()
      .then(client => ping.recordActivity(client))
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

const check = (event, context, callback) => {
  authProvider()
    .then(client => ping.checkActivity(client))
    .then(() => callback(null, 'Check done'));
}

module.exports = {
  hello,
  ping,
  check
};
