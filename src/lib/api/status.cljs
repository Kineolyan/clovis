(ns lib.api.status
  (:require [lib.api.meta :as meta]
            [lib.google.auth :as auth]
            [lib.google.ping :as ping]))

(def ping-provider (auth/create-service-auth ping/scopes))

(defn ping
  [event, _context, callback]
  (meta/with-secret
    {:event event :callback callback}
    {:read #(.. % -event -queryStringParameters -soni)
     :get (constantly "present")}
    (fn [cbk]
      (-> (ping-provider)
          (.then ping/record-activity)
          (.then #(cbk nil (meta/make-text-response "Done")))))))

(defn check
  [_event _context callback]
  (-> (ping-provider)
      (.then ping/check-activity)
      (.then #(callback nil (meta/make-text-response "Check done")))))
