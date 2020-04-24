(ns lib.google.ping
  (:require [lib.google.config :as config]
            [lib.google.mail :as mail]
            [lib.google.sheets :as sheets]))

(enable-console-print!)

(def scopes ["https://www.googleapis.com/auth/spreadsheets"])

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
      (let [payload (clj->js {:spreadsheetId sheet-id :range range})]
        (sheets/read-values api payload (partial resolve reject))))))

(defn after-write
  [resolve reject err]
  (if err
    (do (js/console.error "Cannot write data" err)
        (reject err))
    (resolve)))

(defn write-time-with-api
  ([api range] (write-time-with-api api range (js/Date.)))
  ([api range now]
   (js/Promise.
    (fn [resolve reject]
      (let [time (if now (.getTime now) "")
            human-time (if now (str (.toLocaleDateString now) " " (.toLocaleTimeString now)) "")
            values [[time human-time]]
            payload (clj->js {:spreadsheetId sheet-id
                              :range range
                              :valueInputOption "RAW"
                              :resources {:range range :values values}})]
        (sheets/update-values api payload (partial after-write resolve reject)))))))

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

(defn process-activity
  [api [ping-time alert-time]]
  (if-not ping-time
    (js/console.log "No data recorded yet")
    (let [is-down (house-down? (.-time ping-time))]
      (cond
        (and is-down alert-time) (-> (notify-alert)
                                     (.then (partial write-alert-time api)))
        (and (not is-down) alert-time) (-> (notify-resolution)
                                           (.then (partial reset-alert-time api)))
        :else (js/console.log (str "Nothing to do. State: " (if is-down "down" "up")))))))

(defn check-activity-with-api
  [api]
  (-> [(read-current-time api)
       (read-alert-time api)]
      (js/Promise.all)
      (.then (partial process-activity api))))

(defn record-activity
  [auth]
  (let [sheets (sheets/create-api auth)]
    (write-current-time sheets)))

(defn check-activity
  [auth]
  (let [sheets (sheets/create-api auth)]
    (check-activity-with-api sheets)))
