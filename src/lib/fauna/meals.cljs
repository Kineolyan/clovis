(ns lib.fauna.meals
  (:require [clojure.string :as str]
            [lib.fauna.query :as q]
            [lib.fauna.config :as config]
            [goog.string :as gstring]
            goog.string.format
            [promesa.core :as p]))

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
  (let [query (q/Map (q/Paginate (q/Match (q/Index config/meal-index)))
                   (q/Lambda "e" (q/Get (q/Var "e"))))]
    (-> (.query client query)
        (.then read-values))))

(defn fetch-meal
  [client meal-id]
  (let [query (q/Get (q/Ref (q/Collection config/meal-collection) (str meal-id)))]
    (-> (.query client query)
        (.then read-value))))

(defn update-meal
  [client meal-id update]
  (let [query (q/Update (q/Ref (q/Collection config/meal-collection) (str meal-id))
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
        query (q/Create (q/Collection config/meal-collection)
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
  (let [query (q/Delete (q/Ref (q/Collection config/meal-collection) meal-id))]
    (.query client query)))


(defn date->QDate
  [{:keys [year month day]}]
  (q/Date (gstring/format "%04d-%02d-%02d" year month day)))

(defn query-tasks-between
  [start end]
  (q/Map
    (q/Filter
      (q/Map 
        (q/Paginate
          (q/Documents (q/Collection "tasks")))
        (q/Lambda "X" (q/Get (q/Var "X"))))
      (q/Lambda
        "task"
        (q/LTE
          (date->QDate start)
          (q/Select (clj->js ["data" "due_date"]) (q/Var "task"))
          (date->QDate end))))
    (q/Lambda
      "task"
      (clj->js [(q/Select (clj->js ["data" "name"]) (q/Var "task"))
                (q/Select (clj->js ["data" "due_date"]) (q/Var "task"))]))))

;; Filter(
;;  Map(Paginate(Documents(Collection("tasks"))), Lambda("X", Get(Var("X")))),
;;  Lambda(
;;    "task",
;;    LTE(
;;      Date("2022-03-25"),
;;      Select(["data", "due_date"], Var("task")),
;;      Date("2022-03-26")
;;    )
;;  )
;;)

(defn extract-tasks
  [result]
  (->> (js->clj result :keywordize-keys true) 
       :data))

(comment
  (require '[lib.fauna.auth :as auth])
  (do
    (def client (auth/get-client))
    (def query-res 
      (.query client (query-tasks-between {:year 2022 :month 3 :day 23}
                                          {:year 2022 :month 3 :day 30})))
    (.then query-res #(def answer* %))
    (def tasks (extract-tasks answer*)))

  )

