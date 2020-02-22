// @ts-check
const {google} = require('googleapis');

const {
	getReadMealRange: readRange,
	getUpdateTaskRange: updateRange
} = require('./config');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

const SHEET_ID = '1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8';

function formatMeal([name, lastTimestamp, cookedTimes, comments, source, rating], i) {
	return {
		id: i,
		name,
		lastTimestamp: lastTimestamp || undefined,
		cookedTimes: cookedTimes ? parseInt(cookedTimes, 10) : 0,
		comments: comments || undefined,
		source,
		rating: rating ? parseInt(rating, 10) : undefined
	};
}

function cleanMeal(meal) {
	Object.keys(meal).forEach(key => {
		if (meal[key] === undefined) {
			Reflect.deleteProperty(meal, key);
		}
	});
	return meal;
}

function rowsToMeals(rows) {
	return rows
		.map((row, i) => row !== null ? formatMeal(row, i) : null)
		.map(cleanMeal)
		.filter(task => task !== null);
}

function readMealsWithApi(api, maxRow) {
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
					const result = rowsToMeals(res.data.values);
					resolve(result);
				}
			});
	});
}

// function recordExecutionWithApi(api, {id}) {
// 	const range = updateRange({row: id});
// 	const values = [Date.now()];
// 	const payload = {
// 		spreadsheetId: SHEET_ID,
// 		range,
// 		valueInputOption: 'RAW',
// 		resource: {
// 			"range": range,
// 			"values": [values]
// 		}
// 	};
// 	return new Promise((resolve, reject) => {
// 		api.spreadsheets.values.update(
// 			payload,
// 			(err) => {
// 				if (err) {
// 					console.error('Cannot write data ' + err);
// 					reject(err);
// 				} else {
// 					resolve();
// 				}
// 			});
// 	});
// }

function createApi(auth) {
	return google.sheets({version: 'v4', auth});
}

function readMeals(auth) {
	return readMealsWithApi(
		createApi(auth),
		100);
}

function recordExecution(auth, id) {
	return recordExecutionWithApi(
		createApi(auth),
		{id});
}

module.exports = {
	SCOPES,
	readMeals,
	recordExecution,
	__private__: {
		rowsToMeals
	}
};
