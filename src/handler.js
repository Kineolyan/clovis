
const serieApi = require('./api/series');
const statusApi = require('./api/status');
const taskApi = require('./api/tasks');

module.exports = {
  ...statusApi,
  ...serieApi,
  ...taskApi
};
