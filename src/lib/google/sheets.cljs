(ns lib.google.sheets
  (:require ["googleapis" :as gg]))

(defn create-api
  [auth]
  (gg/google.sheets (clj->js {:version "v4" :auth auth})))
