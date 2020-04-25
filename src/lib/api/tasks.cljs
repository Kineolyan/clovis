(ns lib.api.tasks
  (:require [lib.api.meta :as meta]
            [lib.google.auth :as auth]
            [lib.google.tasks :as tasks]))

(def provider (auth/create-service-auth tasks/scopes))

(defn list-tasks
  [_event _context callback]
  (-> (provider)
      (.then tasks/read-tasks)
      (.then #(callback nil (meta/make-json-response %)))))

(defn perform-task
  [{:keys [event callback]}]
  (if-let [task-id (aget event "pathParameters" "id")]
    (-> (provider)
        (.then #(tasks/record-execution % (js/parseInt task-id 10)))
        (.then #(callback nil (meta/make-text-response "Mission accomplished"))))
    (callback nil (meta/make-text-response "No task ids provided" 400))))

(defn do-task
  [event _context callback]
  (meta/with-secret
    {:event event :callback callback}
    {:read #(aget (:event %) "queryStringParameters" "jarvis")
     :get (constantly "please")}
    perform-task))
