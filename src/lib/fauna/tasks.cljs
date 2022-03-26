(ns lib.fauna.tasks
  (:require [lib.fauna.query :as q]
            [goog.string :as gstring]
            goog.string.format
            [promesa.core :as p]
            [cljs-time.core :as ctime]
            [cljs-time.format :as ftime]))

(defn date->QDate
  [date]
  (q/Date
    (ftime/unparse (ftime/formatters :date) date)))

(defn query-tasks-to-today
  [today]
  (let [end-date (ctime/plus today (ctime/days 1))]
    (q/Map
      (q/Filter
        (q/Map 
          (q/Paginate
            (q/Documents (q/Collection "tasks")))
          (q/Lambda "X" (q/Get (q/Var "X"))))
        (q/Lambda
          "task"
          (q/LTE
            (q/Select (clj->js ["data" "due_date"]) (q/Var "task"))
            (date->QDate end-date))))
      (q/Lambda
        "task"
        (clj->js [(q/Select (clj->js ["data" "name"]) (q/Var "task"))
                  (q/Select (clj->js ["data" "due_date"]) (q/Var "task"))])))))

(defn query-coming-tasks
  [today]
  (q/Map
    (q/Filter
      (q/Map 
        (q/Paginate
          (q/Documents (q/Collection "tasks")))
        (q/Lambda "X" (q/Get (q/Var "X"))))
      (q/Lambda
        "task"
        (q/LTE
          (date->QDate today)
          (q/Select (clj->js ["data" "due_date"]) (q/Var "task"))
          (date->QDate (ctime/plus today (ctime/days 2))))))
    (q/Lambda
      "task"
      (clj->js [(q/Select (clj->js ["data" "name"]) (q/Var "task"))
                (q/Select (clj->js ["data" "due_date"]) (q/Var "task"))]))))

(defn extract-tasks
  [result]
  (->> (js->clj result :keywordize-keys true) 
       :data))

(comment
  (require '[lib.fauna.auth :as auth])
  (do
    (def client (auth/get-client))
    (def query-res (.query client (query-coming-tasks (ctime/today))))
    (.then query-res #(def answer* %))
    (def tasks (extract-tasks answer*)))

  )

