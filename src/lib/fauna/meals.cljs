(ns lib.fauna.meals
  (:require [clojure.string :as str]
            ["faunadb" :as faunadb]
            [lib.fauna.config :as config]))

(def Get faunadb/query.Get)
(def Create faunadb/query.Create)
(def Collection faunadb/query.Collection)
(def Map faunadb/query.Map)
(def Paginate faunadb/query.Paginate)
(def Match faunadb/query.Match)
(def Index faunadb/query.Index)
(def Lambda faunadb/query.Lambda)
(def Val faunadb/query.Var)
(def Update faunadb/query.Update)
(def Ref faunadb/query.Ref)
(def Delete faunadb/query.Delete)

;; (def json-content "{\"data\":[{\"ref\":{\"@ref\":{\"id\":\"263867298248393216\",\"collection\":{\"@ref\":{\"id\":\"meals\",\"collection\":{\"@ref\":{\"id\":\"collections\"}}}}}},\"ts\":1587902315280000,\"data\":{\"name\":\"Curry de patate douce\",\"count\":1,\"source\":\"Simplissime végétarien\",\"lastTime\":1234567890,\"rating\":5}},{\"ref\":{\"@ref\":{\"id\":\"263872872834925067\",\"collection\":{\"@ref\":{\"id\":\"meals\",\"collection\":{\"@ref\":{\"id\":\"collections\"}}}}}},\"ts\":1587907631630000,\"data\":{\"name\":\"Tarte saumon brocoli\",\"count\":1,\"source\":\"Maison\",\"lastTime\":1234567890,\"rating\":4,\"comments\":\"Testée avec chou fleur : ok mais pas ouf \"}}]}")
;; (def results (js/JSON.parse json-content))

(defn get-entry-id
  [entry]
  (-> entry (aget "ref") (.-id)))

(defn pack-entry
  [entry]
  {:id (get-entry-id entry)
   :data (get entry "data")})

(defn read-value
  [entry]
  {:id (get-entry-id entry)
   :data (js->clj (aget entry "data"))})

(defn read-values
  [payload]
  (map read-value (aget payload "data")))

(defn list-meals
  [client]
  (let [query (Map (Paginate (Match (Index config/meal-index)))
                   (Lambda "e" (Get (Val "e"))))]
    (-> (.query client query)
        (.then read-values))))

(defn fetch-meal
  [client meal-id]
  (let [query (Get (Ref (Collection config/meal-collection) (str meal-id)))]
    (-> (.query client query)
        (.then read-value))))

(defn update-meal
  [client meal-id update]
  (let [query (Update (Ref (Collection config/meal-collection) (str meal-id))
                      (clj->js {:data update}))]
    (.query client query)))

(defn mark-as-cooked
  [client meal-id time]
  (let [meal (fetch-meal client meal-id)
        count (.then meal #(get-in % [:data "count"]))
        updated-data (.then count #(hash-map :count (inc %)
                                             :lastTime time
                                             :rating 5))]
    (.then updated-data #(update-meal client meal-id %))))

(defn filter-input
  [allowed-keys input]
  (into {} (filter (comp allowed-keys first) input)))

(def creation-keys #{"name" "count" "rating" "source" "comments"})
(def update-keys #{"name" "rating" "source" "comments"})

(defn complete-meal
  [meal]
  (merge {:lastTime (js/Date.now)}
         meal))

(defn validate-meal
  [meal]
  (when (str/blank? (get meal "name"))
    (throw (js/Error. "No name for the meal"))))

(defn create-meal
  [client user-input]
  (let [user-meal (filter-input creation-keys user-input)
        _ (validate-meal user-meal)
        meal (complete-meal user-meal)
        query (Create (Collection config/meal-collection)
                      (clj->js {:data meal}))]
    (-> (.query client query)
        (.then read-value))))

(defn edit-meal
  [client meal-id changes]
  (let [update (filter-input update-keys changes)]
    (-> (update-meal client meal-id update)
        (.then read-value))))

(defn delete-meal
  [client meal-id]
  (let [query (Delete (Ref (Collection config/meal-collection) meal-id))]
    (.query client query)))
