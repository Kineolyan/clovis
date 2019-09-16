// @ts-check
const {
  handleWithSecret, 
  makeJsonResponse,
  makeTextResponse
} = require('./meta.js');
const {createServiceAuthentication} = require('../google/auth.js');
const tasks = require('../google/tasks');

const provider = createServiceAuthentication(tasks.SCOPES);

function listTasks(event, context, callback) {
  provider()
    .then(client => tasks.readTasks(client))
    .then(data => {
      const response = makeJsonResponse({body: data});
      callback(null, response);
    });
}

function doTask(event, context, callback) {
  handleWithSecret(
    {event, callback},
    {
      read: payload => payload.event.queryStringParameters.jarvis,
      get: () => 'please'
    },
    ({event, callback}) => {
      const taskId = event.pathParameters.id;
      if (taskId === 'cat') {
        provider()
          .then(client => tasks.recordCatCleaning(client))
          .then(() => {
            const response = makeTextResponse({body: 'Ron ron!'});
            callback(null, response);
          });
      } else if (taskId !== undefined) {
        const id = parseInt(taskId, 10);
        provider()
          .then(client => tasks.recordExecution(client, id))
          .then(() => {
            const response = makeTextResponse({body: 'Mission accomplished.'});
            callback(null, response);
          });
      } else {
        callback(
          null,
          makeTextResponse({
            code: 400,
            body: `No task ids provided`
          }));
      }
    }
  );
}

function getCatTask(event, context, callback) {
  provider()
    .then(client => tasks.readCatTime(client))
    .then(data => {
      const response = makeJsonResponse({body: data});
      callback(null, response);
    });
}

module.exports = {
  listTasks,
  doTask,
  getCatTask
};
