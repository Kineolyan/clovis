// @ts-check
const {google} = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

const SHEET_ID = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';
const FIRST_ROW = 3;
const RANGES  = `Notes!H${FIRST_ROW}:K${FIRST_ROW + 100}`;

function formatSeries(data) {
	return data.map(([name, episodeIdx, lastEpisodeIdx, timestamp], i) => ({
		name,
		episodeIdx,
		lastEpisodeIdx,
		timestamp,
		row: FIRST_ROW + i,
	}));
}
function readSeriesWithApi(api) {
	return new Promise((resolve, reject) => {
		api.spreadsheets.values.get(
			{
				spreadsheetId: SHEET_ID,
				range: RANGES,
			},
			(err, res) => {
				if (err) {
					console.error('The API returned an error: ' + err);
					reject(err);
				} else {
					const rows = res.data.values;
					const result = formatSeries(rows);
					resolve(result);
				}
			});
	});
}

function recordWatchedEpisodeWithApi(api, serie) {
	const range = `Notes!J${serie.row}:J${serie.row}`;
	const values = [serie.episodeIdx + 1];
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
					console.log('Write successful!');
					resolve();
				}
			});
	});
}

function readSeries(auth) {
	const sheets = google.sheets({version: 'v4', auth});
	return readSeriesWithApi(sheets);
}

function recordWatchedEpisode(auth, row, episode) {
	const sheets = google.sheets({version: 'v4', auth});
	return recordWatchedEpisodeWithApi(
		sheets,
		{
			row,
			episodeIdx: episode
		});
}

module.exports = {
	SCOPES,
	readSeries,
	recordWatchedEpisode
};
