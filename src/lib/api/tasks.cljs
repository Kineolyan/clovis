(ns lib.api.tasks
  (:require [lib.api.meta :as meta]
            [lib.fauna.auth :as auth]
            [lib.fauna.tasks :as tasks]
            [lib.aws.mail :as mail]
            [promesa.core :as p]))

(defn task-reminder
  [_event _context callback]
  (let [client (auth/get-client)]
    (-> (tasks/build-reminder-message! client)
        (p/then #(mail/send-mail! {:originator "kineolyan+jarvis@gmail.com"
                                   :destinators ["kineolyan@protonmail.com"
                                                 "colomberib@gmail.com"]
                                   :subject "[Jarvis dit] Les tâches du jour"
                                   :body %}))
        (p/then (fn [_] (callback nil (meta/make-text-response "done")))))))

