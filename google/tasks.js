// @ts-check
const {google} = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

const SHEET_ID = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';
const FIRST_ROW = 3;
function getReadRanges(maxRow) {
	return `Notes!M${FIRST_ROW}:P${FIRST_ROW + maxRow}`;
}

function computeDueDate(frequency, lastOccurence) {
	return Date.now();
}

function formatTasks(data) {
	return data.map(([name, frequency, dueDate, timestamp], i) => {
		const t = parseInt(timestamp, 10);
		return {
			id: i,
			name,
			frequency: frequency,
			dueDate: dueDate ? parseInt(dueDate, 10) : computeDueDate(frequency, t),
			timestamp: t
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
		.then(result => {
			return 
		});
}

function recordCatCleaning(auth) {
	return recordExecution(auth, 0);
}

module.exports = {
	SCOPES,
	readTasks,
	recordExecution
};
