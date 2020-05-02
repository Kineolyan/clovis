(ns lib.api.meals
  (:require [clojure.string :as str]
            [lib.fauna.auth :as auth]
            [lib.fauna.meals :as meals]
            [lib.api.meta :as meta]))

(defn list-meals
  [_event _context  callback]
  (-> (auth/get-client)
      (meals/list-meals)
      (.then #(callback nil (meta/make-json-response %))
             callback)))

(defn exec-creation
  [{:keys [event callback]}]
  (let [input (meta/json->clj (.-body event))]
    (-> (auth/get-client)
        (meals/create-meal input)
        (.then #(callback nil (meta/make-json-response %))
               callback))))

(defn create-meal
  [event _context callback]
  (meta/with-secret
    {:event event :callback callback}
    {:read #(meta/query-param (:event %) "miam")
     :get (constantly "miam")}
    exec-creation))

(defn exec-update
  [{:keys [event callback]}]
  (let [id (meta/path-param event "id")
        input (meta/json->clj (.-body event))]
    (-> (auth/get-client)
        (meals/edit-meal id input)
        (.then #(callback nil (meta/make-json-response %))
               callback))))

(defn update-meal
  [event _content callback]
  (meta/with-secret
    {:event event :callback callback}
    {:read #(meta/query-param (:event %) "miam")
     :get (constantly "miam")}
    exec-update))

(defn exec-cooked
  [{:keys [event callback]}]
  (let [meal-id (meta/path-param event "id")
        user-time (when (str/blank? (.-body event))
                    (js/parseInt (.-body event)))
        timestamp (if (int? user-time) user-time (js/Date.now))]
    (-> (auth/get-client)
        (meals/mark-as-cooked meal-id timestamp)
        (.then (fn [& _] (callback nil (meta/make-text-response "Ding!")))
               callback))))

(defn mark-as-cooked
  [event _context callback]
  (meta/with-secret
    {:event event :callback callback}
    {:read #(meta/query-param (:event %) "miam")
     :get (constantly "miam")}
    exec-update))

(defn exec-deletion
  [{:keys [event callback]}]
  (let [meal-id (meta/path-param event "id")]
    (-> (auth/get-client)
        (meals/delete-meal meal-id)
        (.then (fn [& _] (callback nil (meta/make-text-response "Woosh!")))
               callback))))

(defn delete-meal
  [event _context callback]
  (meta/with-secret
    {:event event :callback callback}
    {:read #(meta/query-param (:event %) "miam")
     :get (constantly "miam")}
    exec-deletion))