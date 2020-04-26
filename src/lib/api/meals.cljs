(ns lib.api.meals
  (:require [lib.fauna.auth :as auth]
            [lib.fauna.meals :as meals]
            [lib.api.meta :as meta]))

(enable-console-print!)

(defn list-meals
  [_event _context  callback]
  (-> (auth/get-client)
      (meals/list-meals)
      (.then #(callback nil (meta/make-json-response %))
             #(callback (js/Error. %)))))

(defn mark-as-cooked
  [event _context callback]
  (let [meal-id (meta/path-param event "id")]
    (js/console.log "m >>" meal-id)
    (-> (auth/get-client)
        (meals/mark-as-cooked meal-id (js/Date.now))
        (.then #(callback nil (meta/make-text-response (str % "Ding!")))))))
