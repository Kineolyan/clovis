(ns lib.google.tasks
  (:require [clojure.string :as str]
            [lib.google.config :as config]
            [lib.google.sheets :as sheets]))

(def read-range config/get-read-task-range)
(def update-range config/get-update-task-range)

(def scopes ["https://www.googleapis.com/auth/spreadsheets"])

(def sheet-id "1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8")
(def days-in-ms (* 24 3600 1000))

(def defined? (complement str/blank?))
(def not-defined? (complement defined?))

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
  (if-not (defined? last-occurence)
    0
    (if-let [{:keys [duration unit]} (parse-frequency frequency)]
      (+ last-occurence (* duration (get-frequency-offset unit))))))

(defn format-task
  [[name frequency due-timestamp exec-timestamp] i]
  (let [t (js/parseInt exec-timestamp 10)
        due-date (if (defined? due-timestamp)
                   (js/parseInt due-timestamp 10)
                   (compute-due-date frequency t))
        days-to-target (js/Math.round (/ (- due-date (js/Date.now)) days-in-ms))]
    {:id i
     :name name
     :frequency frequency
     :dueDate due-date
     :daysToTarget days-to-target}))

(defn executed?
  [[_ frequency due-timestamp exec-timestamp & _]]
  (or (defined? frequency)
      (and (defined? due-timestamp) (not-defined? exec-timestamp)))) ; Punctual tasks not executed

(defn rows->tasks
  [rows]
  (->> (map vector rows (range))
       (filter (comp executed? first))
       (map (partial apply format-task))))

(defn read-tasks-with-api
  [api max-row]
  (js/Promise. (fn [resolve reject]
                 (sheets/read-values
                  api
                  (clj->js {:spreadsheetId sheet-id
                            :range (read-range {:limit max-row})})
                  #(if %1
                     (reject %1)
                     (-> %2 rows->tasks resolve))))))

(defn record-execution-with-api
  [api id]
  (let [range (update-range {:row id})
        values [[(js/Date.now)]]
        payload (clj->js {:spreadsheetId sheet-id
                          :range range
                          :valueInputOption "RAW"
                          :resource {:range range
                                     :values values}})]
    (js/Promise. (fn [resolve reject]
                   (sheets/update-values api payload #(if % (reject %) (resolve)))))))

(defn read-tasks
  [auth]
  (read-tasks-with-api (sheets/create-api auth) 100))

(defn record-execution
  [auth id]
  (record-execution-with-api (sheets/create-api auth) id))
