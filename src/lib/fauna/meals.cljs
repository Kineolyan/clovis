(ns lib.fauna.meals
  (:require ["faunadb" :as faunadb]))

(enable-console-print!)

(def Get faunadb/query.Get)
(def Collection faunadb/query.Collection)
(def Map faunadb/query.Map)
(def Paginate faunadb/query.Paginate)
(def Match faunadb/query.Match)
(def Index faunadb/query.Index)
(def Lambda faunadb/query.Lambda)
(def Val faunadb/query.Var)
(def Update faunadb/query.Update)
(def Ref faunadb/query.Ref)

;; (def json-content "{\"data\":[{\"ref\":{\"@ref\":{\"id\":\"263867298248393216\",\"collection\":{\"@ref\":{\"id\":\"meals\",\"collection\":{\"@ref\":{\"id\":\"collections\"}}}}}},\"ts\":1587902315280000,\"data\":{\"name\":\"Curry de patate douce\",\"count\":1,\"source\":\"Simplissime végétarien\",\"lastTime\":1234567890,\"rating\":5}},{\"ref\":{\"@ref\":{\"id\":\"263872872834925067\",\"collection\":{\"@ref\":{\"id\":\"meals\",\"collection\":{\"@ref\":{\"id\":\"collections\"}}}}}},\"ts\":1587907631630000,\"data\":{\"name\":\"Tarte saumon brocoli\",\"count\":1,\"source\":\"Maison\",\"lastTime\":1234567890,\"rating\":4,\"comments\":\"Testée avec chou fleur : ok mais pas ouf \"}}]}")
;; (def results (js/JSON.parse json-content))

(defn get-entry-id
  [entry]
  (-> entry (get "ref") (.-id)))

(defn pack-entry
  [entry]
  {:id (get-entry-id entry)
   :data (get entry "data")})

(defn read-result
  [payload]
  (js->clj (aget payload "data")))

(defn read-values
  [payload]
  (map pack-entry (read-result payload)))

(defn read-value
  [meal-id entry]
  {:id meal-id
   :data (apply hash-map (get entry "arr"))})

(defn list-meals
  [client]
  (let [query (Map (Paginate (Match (Index "meal-list")))
                   (Lambda "e" (Get (Val "e"))))]
    (-> (.query client query)
        (.then read-values))))

(defn fetch-meal
  [client meal-id]
  (let [query (Get (Ref (Collection "meals") (str meal-id)))]
    (-> (.query client query)
        (.then (partial read-value meal-id)))))

(defn update-meal
  [client meal-id update]
  (let [query (Update (Ref (Collection "meals") (str meal-id))
                      (clj->js {:data update}))]
    (.query client query)))

(defn mark-as-cooked
  [client meal-id time]
  (let [meal (fetch-meal client meal-id)
        count (.then meal #(get % [:data "count"]))
        updated-data (.then count #(hash-map :count (inc %)
                                             :lastTime time))]
    (.then updated-data #(update-meal client meal-id %))))

(def allowed-keys #{:rating :source :comments})
(defn edit-meal
  [client meal-id changes]
  (let [update (into {} (filter (comp allowed-keys first) changes))]
    (update-meal client meal-id update)))
