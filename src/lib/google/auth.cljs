(ns lib.google.auth
  (:require ["googleapis" :as gg]))

(enable-console-print!)

(defn create-service-auth
  [scopes]
  (let [auth-method (.. gg/google -auth -getClient)
        auth (auth-method (clj->js {:scopes scopes}))]
    (constantly auth)))
