(ns lib.api.tasks
  (:require [lib.api.meta :as meta]
            [lib.fauna.tasks :as tasks]))

(defn task-reminder
  [_event _context callback]
  (callback nil (meta/make-text-response "done")))

