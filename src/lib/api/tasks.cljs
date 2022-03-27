(ns lib.api.tasks
  (:require [cljs.nodejs :as node]
            [lib.api.meta :as meta]
            [lib.fauna.auth :as auth]
            [lib.fauna.tasks :as tasks]
            [lib.aws.mail :as mail]
            [promesa.core :as p]))

(def email-list
  (if (= (aget node/process "env" "STAGE") "prod")
    ["kineolyan@protonmail.com"
     "colomberib@gmail.com"]
    ["kineolyan@protonmail.com"]))

(defn task-reminder
  [_event _context callback]
  (let [client (auth/get-client)]
    (-> (tasks/build-reminder-message! client)
        (p/then #(mail/send-mail! {:originator "kineolyan+jarvis@gmail.com"
                                   :destinators email-list
                                   :subject "[Jarvis dit] Les tâches du jour"
                                   :body %}))
        (p/then (fn [_] (callback nil (meta/make-text-response "done")))))))

