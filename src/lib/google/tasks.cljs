(ns lib.google.tasks
  (:require ["googleapis" :as gg]
            [lib.google.config :as config]))

(def read-range config/get-read-task-range)
(def update-range config/get-update-task-range)

(def scopes ["https://www.googleapis.com/auth/spreadsheets"])

(def sheet-id "1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8")
(def days-in-ms (* 24 3600 1000))

(def frequency-pattern #"^(\d+)\s*([a-z]+)$")
(defn parse-frequency [v]
   (when-let [[_ duration unit] (re-matches frequency-pattern v)]
     {:duration (js/parseInt duration 10)
      :unit unit}))

(defn get-frequency-offset
  [unit]
  (case unit
    "d" days-in-ms
    "w" (* 7 days-in-ms)
    "m" (* 30 days-in-ms)
    (* -1 100 365 days-in-ms)))

(defn compute-due-date
  [frequency last-occurence]
  (if-not last-occurence
    0
    (if-let [{:keys [duration unit]} (parse-frequency frequency)]
      (+ last-occurence (* duration (get-frequency-offset unit))))))

(defn format-task
  [[name frequency due-timestamp exec-timestamp] i]
  (let [t (js/parseInt exec-timestamp 10)
        due-date (if due-timestamp 
                   (js/parseInt due-timestamp 10)
                   (compute-due-date frequency t))
        days-to-target (js/Math.round (/ (- due-date (js/Date.now)) days-in-ms))]
    {:id i
     :name name
     :frequency frequency
     :dueDate due-date
     :daysToTarget days-to-target}))

(defn executed?
  [[_ frequency due-timestamp exec-timestamp &]]
  (or frequency
      (and due-timestamp (not exec-timestamp)))) ; Punctual tasks not executed

(defn rows->tasks
  [rows]
  (->> (map vector rows (range))
       (filter (comp executed? first))
       (map format-task)))

function rowsToTasks(rows) {
	return rows
		.map(row => filterExecutedTask(row) ? row : null)
		.map((row, i) => row !== null ? formatTask(row, i) : null)
		.filter(task => task !== null);
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
					const result = rowsToTasks(res.data.values);
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
		computeDueDate,
		rowsToTasks
	}
};
