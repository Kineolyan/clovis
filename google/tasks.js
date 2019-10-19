// @ts-check
const {google} = require('googleapis');

const {
	getReadTaskRange: readRange,
	getUpdateTaskRange: updateRange
} = require('./config');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

const SHEET_ID = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';
const DAY_IN_MS = 24 * 3600 * 1000;

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

function formatTask([name, frequency, dueTimestamp, execTimestamp], i) {
	const t = parseInt(execTimestamp, 10);
	const dueDate = dueTimestamp
		? parseInt(dueTimestamp, 10)
		: computeDueDate(frequency, t);
	const daysToTarget = Math.round((dueDate - Date.now()) / DAY_IN_MS);
	return {
		id: i,
		name,
		frequency,
		dueDate,
		daysToTarget
	};
}

function filterExecutedTask(row) {
	const [,frequency, dueTimestamp, execTimestamp] = row;
	return frequency // Recurrent tasks are always ok
		|| dueTimestamp && !execTimestamp; // Punctual tasks not executed
}

function readTasksWithApi(api, maxRow) {
	return new Promise((resolve, reject) => {
		api.spreadsheets.values.get(
			{
				spreadsheetId: SHEET_ID,
				range: readRange({limit: maxRow}),
			},
			(err, res) => {
				if (err) {
					console.error('The API returned an error: ' + err);
					reject(err);
				} else {
					const result = res.data.values
						.map(row => filterExecutedTask(row) ? row : null)
						.map((row, i) => row !== null ? formatTask(row, i) : null)
						.filter(task => task !== null);
					resolve(result);
				}
			});
	});
}

function recordExecutionWithApi(api, {id}) {
	const range = updateRange({row: id});
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
	recordCatCleaning,
	__private__: {
		parseFrequency,
		getFrequencyOffset,
		computeDueDate
	}
};
