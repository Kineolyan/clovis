(ns lib.fauna.tasks
  (:require [clojure.string :as str]
            [lib.fauna.query :as q]
            [goog.string :as gstring]
            goog.string.format
            [promesa.core :as p]
            [cljs-time.core :as ctime]
            [cljs-time.format :as ftime]))

(defn date->QDate
  [date]
  (q/Date
    (ftime/unparse (ftime/formatters :date) date)))

(defn FDate->timestamp
  [date]
  (-> date .-date .getTime))

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

(defn result->task
  [result]
  (zipmap [:name :due-date] result))

(defn result->tasks
  [result]
  (->> (js->clj result :keywordize-keys true) 
       :data
       (map result->task)))

(defn fetch-tasks
  "Fetchs a list of tasks from FaunaDB and formats it."
  [client query]
  (p/let [answer (.query client query)]
   (def answer* answer)
   (result->tasks answer)))


(def mail-template
  "HellO-livier, CouCo-lombe,

penses à regarder les trucs à faire aujourd'hui :

%s

Et voici ce qu'il faudra aussi bientôt ;-)

%s

Au travail :)")

(defn format-due-task
  [task]
  (gstring/format " - %s (à faire pour le %s)"
                   (:name task)
                   (-> task :due-date .-value)))

(defn format-coming-task
  [task]
  (gstring/format " - %s" (:name task)))

(defn build-mail-content
  [{due-tasks :due coming-tasks :coming}]
  (let [due-labels (->> due-tasks
                        (sort-by FDate->timestamp <)
                        (map format-due-task)
                        (str/join "\n"))
        coming-labels (->> coming-tasks
                           (map format-coming-task)
                           (str/join "\n"))]
    (gstring/format mail-template due-labels coming-labels)))

(defn build-reminder-message
  [client]
  (p/plet [due-tasks (fetch-tasks client (query-tasks-to-today (ctime/today)))
           coming-tasks (fetch-tasks client (query-coming-tasks (ctime/today)))]
          (build-mail-content {:due due-tasks :coming coming-tasks} )))

(comment
  (build-mail-content {:due tasks* :coming tasks*})
  )

(comment
  (require '[lib.fauna.auth :as auth])
  (def client (auth/get-client))
  (p/let [tasks (fetch-tasks client (query-tasks-to-today (ctime/today)))]
    (def tasks* tasks))
  
(p/let [msg (build-reminder-message client)]
  (js/console.log msg))
  )

