const SPREADSHEET = process.env.STAGE == 'prod'
  ? 'System'
  : 'System-dev';

function getPingRange() {
  return `${SPREADSHEET}!B1:C1`;
}
function getAlertRange() {
  return `${SPREADSHEET}!B2:C2`;
}

function getSerieRange(maxRow) {
  return `${SPREADSHEET}!E${FIRST_ROW}:H${FIRST_ROW + maxRow - 1}`;
}

function getTaskRange(maxRow) {
	return `${SPREADSHEET}!J${FIRST_ROW}:M${FIRST_ROW + maxRow - 1}`;
}

module.exports = {
  getPingRange,
  getAlertRange,
  getSerieRange,
  getTaskRange
};
