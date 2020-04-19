
const serieApi = require('./lib/api/series');
const statusApi = require('./lib/api/status');
const taskApi = require('./lib/api/tasks');

module.exports = {
  ...statusApi,
  ...serieApi,
  ...taskApi
};
