(ns lib.api.series
  (:require [lib.api.meta :as meta]
            [lib.google.auth :as auth]
            [lib.google.serie :as serie]))

(def provider  (auth/create-service-auth serie/SCOPES))

(defn list-series 
  [_event _content callback]
  (-> (provider)
      (.then serie/read-series)
      (.then #(callback nil (meta/make-json-response %)))))

(defn do-watch
  [id episode callback]
  (-> (provider)
      (.then #(serie/record-watched-episode % id episode))
      (.then #(callback nil (meta/make-text-response "Done")))))

(defn watch-serie
  [event _content callback]
  (meta/with-secret
    {:event event
     :callback callback}
    {:read #(.. (:event %) -queryStringParameters -secret)
     :get (constantly "username")}
    (fn [{:keys [event callback]}]
      (if-let [id (js/parseInt (.. event -pathParameters -id))]
        (do-watch id 
                  (js/parseInt (meta/json->clj (.-body event))) 
                  callback)
        (callback nil (meta/make-text-response "No row provided" 400))))))
