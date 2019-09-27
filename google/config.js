// @ts-check
function getSpreadsheet(stage) {
  switch (stage) {
  case 'prod': 
    return 'System';
  case 'test':
  case 'dev': 
    return 'System-dev';
  default:
    throw new Error(`Stage not supported: ${stage}`);
  }
}
const SPREADSHEET = getSpreadsheet(process.env.STAGE);

function getPingRange() {
  return `${SPREADSHEET}!B1:C1`;
}
function getAlertRange() {
  return `${SPREADSHEET}!B2:C2`;
}

function getRange(range) {
  if (range.row !== undefined) {
    return {from: range.row, to: range.row};
  }
  
  const from = range.from || 0;
  if (range.to !== undefined) {
    return {from, to: range.to};
  } else {
    const limit = range.limit || 100;
    const to =  from + limit - 1;
    return {from, to};
  }
}

const SERIE_FIRST_ROW = 3;
function getReadSerieRange(range) {
  const {from, to} = getRange(range);
  return `${SPREADSHEET}!E${SERIE_FIRST_ROW + from}:H${SERIE_FIRST_ROW + to}`;
}
function getUpdateSerieRange(range) {
  const {from, to} = getRange(range);
  return `${SPREADSHEET}!G${SERIE_FIRST_ROW + from}:H${SERIE_FIRST_ROW + to}`;
}

const TASK_FIRST_ROW = 3;
function getReadTaskRange(range) {
  const {from, to} = getRange(range);
	return `${SPREADSHEET}!J${TASK_FIRST_ROW + from}:M${TASK_FIRST_ROW + to}`;
}
function getUpdateTaskRange(range) {
  const {from, to} = getRange(range);
	return `${SPREADSHEET}!M${TASK_FIRST_ROW + from}:M${TASK_FIRST_ROW + to}`;
}

module.exports = {
  getPingRange,
  getAlertRange,
  getReadSerieRange,
  getUpdateSerieRange,
  getReadTaskRange,
  getUpdateTaskRange
};
