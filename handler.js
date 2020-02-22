
const serieApi = require('./api/series');
const statusApi = require('./api/status');
const taskApi = require('./api/tasks');
const mealApi = require('./api/meals');

module.exports = {
  ...statusApi,
  ...serieApi,
  ...taskApi,
  ...mealApi
};
