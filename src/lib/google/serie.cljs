(ns lib.google.serie
  (:require [lib.google.config :as config]
            [lib.google.sheets :as sheets]))

(enable-console-print!)

(def read-range config/get-read-serie-range)
(def update-range config/get-update-serie-range)
(def SCOPES ["https://www.googleapis.com/auth/spreadsheets"])
(def SHEET-ID "1RtpgoMpHfqunNL92-0gVN2dA3OKZTpRikcUQz6uAxX8")
(def RANGES (read-range {:limit 100}))

(defn format-serie
  [[name, lastEpisodeIdx, episodeIdx, timestamp], i]
  {:id i
   :name name
   :episodeIdx (js/parseInt episodeIdx 10)
   :lastEpisodeIdx (js/parseInt lastEpisodeIdx 10)
   :timestamp (js/parseInt timestamp 10)})

(defn format-series
  [data]
  (map format-serie data (range)))

(defn read-series-with-api
  [api]
  (js/Promise.
   (fn [resolve reject]
     (sheets/read-values
      api
      (clj->js {:spreadsheetId SHEET-ID
                :range RANGES})
      #(if %1
         (do (js/console.error (str "The API returned an error: " %1))
             (reject %1))
         (-> %2
             (.. -data -values)
             format-series
             resolve))))))

(defn record-watched-episode-with-api
  [api id episodeIdx]
  (let [range (update-range {:row id})
        values [(inc episodeIdx) (js/Date.now)]
        payload (clj->js {:spreadsheetId SHEET-ID
                          :range range
                          :valueInputOption "RAW"
                          :resource {:range range
                                     :values [values]}})]
    (js/Promise.
     (fn [resolve reject]
       (sheets/update-values
        api
        payload
        #(if %1
           (do (js/console.error (str "Cannot write data" %1))
               (reject %1))
           (resolve)))))))

(defn read-series
  [auth]
  (let [sheets-api (sheets/create-api auth)]
    (read-series-with-api sheets-api)))

(defn record-watched-episode
  [auth id episode]
  (let [sheets-api (sheets/create-api auth)]
    (record-watched-episode-with-api sheets-api id episode)))
