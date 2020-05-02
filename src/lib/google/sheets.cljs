(ns lib.google.sheets
  (:require ["googleapis" :as gg]))

(defn create-api
  [auth]
  (gg/google.sheets (clj->js {:version "v4" :auth auth})))

(defn value-api
  [api]
  (aget api "spreadsheets" "values"))

(defn value-accessor
  [callback err result]
  (if err
    (callback err nil)
    (callback nil (js->clj (.. result -data -values)))))

(defn read-values
  [api payload callback]
  (.get (value-api api) payload (partial value-accessor callback)))

(defn update-values
  [api payload callback]
  (.update (value-api api) payload callback))
