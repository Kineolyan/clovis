// @ts-check
const {google} = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

const SHEET_ID = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';
const FIRST_ROW = 3;
const DAY_IN_MS = 30 * 24 * 3600 * 1000;
function getReadRanges(maxRow) {
	return `Notes!M${FIRST_ROW}:P${FIRST_ROW + maxRow - 1}`;
}

const FREQUENCY_PATTERN = /^(\d+)\s*([a-z]+)$/;
function parseFrequency(frequency) {
	const match = FREQUENCY_PATTERN.exec(frequency);
	return match === null
		? null
		: {
			duration: parseInt(match[1], 10),
			unit: match[2]
		};
}

function getFrequencyOffset(unit) {
	switch(unit) {
		case 'd': return DAY_IN_MS;
		case 'w': return 7 * DAY_IN_MS;
		case 'm': return 30 * DAY_IN_MS;
		default: return -100 * 365 * DAY_IN_MS;
	}
}

function computeDueDate(frequency, lastOccurence) {
	if (!lastOccurence) {
		return 0;
	}

	const match = parseFrequency(frequency);
	if (match === null) {
		return 0;
	}

	const offset = getFrequencyOffset(match.unit);
	return lastOccurence + offset * match.duration;
}

function getFrequencyWord(unit) {
	switch(unit) {
	case 'd': return 'days';
	case 'w': return 'weeks';
	case 'm': return 'months';
	default: return unit;
	}
}

function getHumanFrequency(frequency) {
	const match = parseFrequency(frequency);
	return match
		? `${match.duration} ${getFrequencyWord(match.unit)}`
		: `<unknown> (${frequency})`;
}

function formatTasks(data) {
	return data.map(([name, frequency, dueTimestamp, execTimestamp], i) => {
		const t = parseInt(execTimestamp, 10);
		const dueDate = dueTimestamp 
			? parseInt(dueTimestamp, 10)
			: computeDueDate(frequency, t);
		const daysToTarget = Math.round((dueDate - Date.now()) / DAY_IN_MS);
		const f = getHumanFrequency(frequency);
		return {
			id: i,
			name,
			frequency: f,
			dueDate,
			daysToTarget,
		};
	});
}

function readTasksWithApi(api, maxRow) {
	return new Promise((resolve, reject) => {
		api.spreadsheets.values.get(
			{
				spreadsheetId: SHEET_ID,
				range: getReadRanges(maxRow),
			},
			(err, res) => {
				if (err) {
					console.error('The API returned an error: ' + err);
					reject(err);
				} else {
					const rows = res.data.values;
					const result = formatTasks(rows);
					resolve(result);
				}
			});
	});
}

function recordExecutionWithApi(api, {id}) {
	const row = FIRST_ROW + id;
	const range = `Notes!P${row}:P${row}`;
	const values = [Date.now()];
	const payload = {
		spreadsheetId: SHEET_ID,
		range,
		valueInputOption: 'RAW',
		resource: {
			"range": range,
			"values": [values]
		}
	};
	return new Promise((resolve, reject) => {
		api.spreadsheets.values.update(
			payload,
			(err) => {
				if (err) {
					console.error('Cannot write data ' + err);
					reject(err);
				} else {
					resolve();
				}
			});
	});
}

function createApi(auth) {
	return google.sheets({version: 'v4', auth});
}

function readTasks(auth) {
	return readTasksWithApi(
		createApi(auth), 
		100);
}

function recordExecution(auth, id) {
	return recordExecutionWithApi(
		createApi(auth),
		{id});
}

function readCatTime(auth) {
	return readTasksWithApi(createApi(auth), 1)
		.then(result => result[0]);
}

function recordCatCleaning(auth) {
	return recordExecution(auth, 0);
}

module.exports = {
	SCOPES,
	readTasks,
	recordExecution,
	readCatTime,
	recordCatCleaning
};
