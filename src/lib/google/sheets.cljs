(ns lib.google.sheets
  (:require ["googleapis" :as gg]))

(defn create-api
  [auth]
  (gg/google.sheets (clj->js {:version "v4" :auth auth})))

(defn read-values
  [api payload callback]
  (-> api
      (.-spreadsheets)
      (.-values)
      (.get payload callback)))

(defn update-values
  [api payload callback]
  (-> api
      (.-spreadsheets)
      (.-values)
      (.update payload callback)))
