(ns lib.google.auth
  (:require ["googleapis" :as gg]))

(defn create-service-auth
  [scopes]
  (let [auth (.. gg/google -auth)
        options (clj->js {:scopes scopes})
        client (.getClient auth options)]
    (constantly client)))
