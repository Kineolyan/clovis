(ns lib.google.ping
  (:require ["googleapis" :as gg]
            [lib.google.config :as config]
            [lib.google.mail :as mail]))

(enable-console-print!)

(def SCOPES ["https://www.googleapis.com/auth/spreadsheets"])

(def sheet-id "1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8")

(defn with-read-time
  [resolve reject err res]
  (if err
    (reject err)
    (let [[[time date]] (.. res -data -values)]
      (if (and time date)
        (resolve {:time time :date date})
        (resolve nil)))))

(defn read-time-with-api
  [api range]
   (js/Promise.
    (fn [resolve reject]
      (let [call (.. api -spreadsheets -values -get)
            payload (clj->js {:spreadsheetId sheet-id :range range})]
        (call payload (partial resolve reject))))))

(defn after-write
  [resolve reject err]
  (if err
    (do (js/console.error "Cannot write data" err)
        (reject err))
    (resolve)))

(defn write-time-with-api
  ([api range] (with-read-time api range (js/Date.)))
  ([api range now]
   (js/Promise.
    (fn [resolve reject]
      (let [time (if now (.getTime now) "")
            human-time (if now (str (.toLocaleDateString now) " " (.toLocaleTimeString now)) "")
            values [[time human-time]]
            payload (clj->js {:spreadsheetId sheet-id
                              :range range
                              :valueInputOption "RAW"
                              :resources {:range range :values values}})
            call (.. api -spreadsheets -values -update)]
        (call payload (partial after-write resolve reject)))))))

(defn read-current-time [api] (read-time-with-api api (config/get-ping-range)))
(defn write-current-time [api] (write-time-with-api api (config/get-ping-range)))

(defn notify-alert
  []
  (js/console.log "Alert! there is something wrong")
  (mail/send-mail {:originator "kineolyan+jarvis@gmail.com"
                   :destinators ["kineolyan@protonmail.com"]
                   :subject "[Alert] House is down"
                   :body "Oops. Pb à la maison"}))

(defn notify-resolution
  []
  (js/console.log "Situation diffused :)")
  (mail/send-mail {:originator "kineolyan+jarvis@gmail.com"
                   :destinators ["kineolyan@protonmail.com"]
                   :subject "[Phew] House is up"
                   :body "Aahh. Retour de la vie informatique :)"}))

(defn read-alert-time [api] (read-time-with-api api (config/get-alert-range)))
(defn write-alert-time [api] (write-time-with-api api (config/get-alert-range)))
(defn reset-alert-time [api] (write-time-with-api api nil))

(def down-time (* 10 60 1000))
(defn house-down?
  [t]
  (let [duration (- (js/Date.now) t)]
    (>= duration down-time)))

(defn record-activity
  [auth]
  (let [sheets (gg/google.sheets (clj->js {:version "v4" :auth auth}))]
    (write-current-time)))

;; function checkActivity(auth) {
;;   const sheets = google.sheets({version: 'v4', auth});
;;   return Promise.all([
;;     readCurrentTime(sheets),
;;     readAlertTime(sheets)
;;   ])
;;     .then(([pingTime, alertTime]) => {
;;       if (pingTime !== null) {
;;         console.log(`Last connection at ${pingTime.date}`);
;;         const isDown = isHomeDown(pingTime.time);
;;         if (isDown && alertTime === null) {
;;           // New alert, notify and register our action
;;           return notifyAlert()
;;             .then(() => writeAlertTime(sheets));
;;         } else if (!isDown && alertTime !== null) {
;;           return notifyResolution()
;;             .then(() => resetAlertTime(sheets));
;;         } else {
;;           console.log(`Nothing to do. State: ${isDown ? 'down' : 'up'}`);
;;         }
;;       } else {
;;         console.log('No data recorded yet.');
;;       }
;;     });
;; }
