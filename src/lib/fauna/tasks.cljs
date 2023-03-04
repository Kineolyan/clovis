(ns lib.fauna.tasks
  (:require [clojure.string :as str]
            [lib.fauna.query :as q]
            [lib.fauna.types :as ft]
            [goog.string :as gstring]
            goog.string.format
            [promesa.core :as p]
            [cljs-time.core :as ctime]
            [cljs-time.format :as ftime]
            [cljs-time.coerce :as ttime]
            [lib.config :as cfg]))

(defn date->QDate
  [date]
  (q/Date
   (ftime/unparse (ftime/formatters :date) date)))

(defn FDate->timestamp
  [^ft/FaunaDate date]
  (-> date .-date .getTime))

(defn FDate->date
  [date]
  (-> (FDate->timestamp date)
      ttime/from-long
      ttime/to-local-date))

(defn list-tasks-fql
  []
  (q/Map
     (q/Paginate
      (q/Documents (q/Collection "tasks")))
     (q/Lambda "X" (q/Get (q/Var "X")))))

(defn select-query-attributes-fql
  []
  (q/Lambda
    "task"
    (clj->js [(q/Select (clj->js ["data" "name"]) (q/Var "task"))
              (q/Select (clj->js ["data" "due_date"]) (q/Var "task"))
              (q/Select (clj->js ["data" "frequency"]) (q/Var "task"))])))

(defn query-tasks-to-today
  [today]
  (q/Map
   (q/Filter
    (list-tasks-fql)
    (q/Lambda
     "task"
     (q/LTE
      (q/Select (clj->js ["data" "due_date"]) (q/Var "task"))
      (date->QDate today))))
   (select-query-attributes-fql)))

(defn query-coming-tasks
  [today]
  (q/Map
   (q/Filter
    (list-tasks-fql)
    (q/Lambda
     "task"
     (q/EQ
      (q/Select (clj->js ["data" "due_date"]) (q/Var "task"))
      (date->QDate (ctime/plus today (ctime/days 1))))))
   (select-query-attributes-fql)))

(defn result->task
  [result]
  (zipmap [:name :due-date :frequency] result))

(defn task-done?
  [task]
  (= "DONE" (get-in task [:frequency :punctual])))

(defn result->tasks
  [result]
  (->> (js->clj result :keywordize-keys true)
       :data
       (map result->task)
       (filter (complement task-done?))
       ; For now, we decide to hide the frequency (only used to filter)
       (map #(dissoc % :frequency))))

(defn fetch-tasks
  "Fetchs a list of tasks from FaunaDB and formats it."
  [client query]
  (p/let [answer (.query client query)]
    (def answer* answer)
    (result->tasks answer)))

(comment
  (result->tasks answer*)
  (pp/print-table *1))

(def mail-template
  "HellO-livier, CouCo-lombe,

penses à regarder les trucs à faire aujourd'hui :

%s

Et voici ce qu'il faudra aussi bientôt ;-)

%s

Au travail :)

PS-sit: par ici pour le site
%s
")

(defn count-late-days
  [value]
  (let [date (FDate->date value)]
    (ctime/in-days (ctime/interval date (ctime/today)))))

(defn format-due-task
  [task]
  (gstring/format " - %s (à faire depuis %d jours)"
                  (:name task)
                  (count-late-days (:due-date task))))

(defn format-coming-task
  [task]
  (gstring/format " - %s" (:name task)))

(defn build-mail-content
  [{due-tasks :due coming-tasks :coming}]
  (let [due-labels (->> due-tasks
                        (sort-by (comp FDate->timestamp :due-date) <)
                        (map format-due-task)
                        (str/join "\n"))
        coming-labels (->> coming-tasks
                           (map format-coming-task)
                           (str/join "\n"))]
    (gstring/format mail-template
                    due-labels
                    coming-labels
                    (:peter cfg/urls))))

(defn build-reminder-message!
  [client]
  (p/plet [due-tasks (fetch-tasks client (query-tasks-to-today (ctime/today)))
           coming-tasks (fetch-tasks client (query-coming-tasks (ctime/today)))]
          (build-mail-content {:due due-tasks :coming coming-tasks})))

(comment
  ;;; Tests to run after upgrade
  (do
    (require '[lib.fauna.auth :as auth])
    (require '[cljs.pprint :as pp])
    (defonce client* (atom nil))
    (reset! client* (auth/get-client)))
  (defonce tasks* (atom nil))
  (def future-date (ctime/plus (ctime/today) (ctime/days 3)))
  (p/let [tasks (fetch-tasks @client* (query-tasks-to-today (ctime/today)))]
    (reset! tasks* tasks))

  (pp/print-table @tasks*)
  (build-mail-content {:due @tasks* :coming @tasks*})

  (p/let [msg (build-reminder-message! @client*)]
    (js/console.log msg)))
