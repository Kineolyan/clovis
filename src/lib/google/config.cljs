(ns lib.google.config
  (:require [cljs.nodejs :as node]))

(defn get-spreadsheet
  [stage]
  (case stage
    "prod" "System"
    "test" "System-dev"
    "dev" "System-dev"))

(def SPREADSHEET (get-spreadsheet (aget node/process "env" "STAGE")))

(defn get-alert-range [] (str SPREADSHEET "!B2:C2"))

(defn get-range
  [{:keys [from to row limit]}]
  (cond
    row {:from row :to row}
    to {:from from :to to}
    :else {:from from
           :to (+ from (or limit 100) -1)}))

(def SERIE-FIRST-ROW 3)
(defn get-read-serie-range
  [range]
  (let [{:keys [from to]} (get-range range)]
    (str SPREADSHEET "!E" (+ SERIE-FIRST-ROW from) ":H" (+ SERIE-FIRST-ROW to))))
(defn get-update-serie-range
  [range]
  (let [{:keys [from to]} (get-range range)]
    (str SPREADSHEET "!G" (+ SERIE-FIRST-ROW from) ":H" (+ SERIE-FIRST-ROW to))))

(def TASK-FIRST-ROW 3)
(defn get-read-task-range
  [range]
  (let [{:keys [from to]} (get-range range)]
    (str SPREADSHEET "!J" (+ TASK-FIRST-ROW from) ":M" (+ TASK-FIRST-ROW to))))
(defn get-update-task-range
  [range]
  (let [{:keys [from to]} (get-range range)]
    (str SPREADSHEET "!M" (+ TASK-FIRST-ROW from) ":M" (+ TASK-FIRST-ROW to))))
