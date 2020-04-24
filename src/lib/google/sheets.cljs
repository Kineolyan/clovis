(ns lib.google.sheets
  (:require ["googleapis" :as gg]))

(defn create-api
  [auth]
  (gg/google.sheets (clj->js {:version "v4" :auth auth})))

(defn value-api
  [api]
  (aget api "spreadsheets" "values"))

(defn read-values
  [api payload callback]
  (.get (value-api api) payload callback))

(defn update-values
  [api payload callback]
  (.update (value-api api) payload callback))
