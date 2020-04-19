(ns lib.handlers)

(defn ping [event context callback]
 (callback (clj->js {:statusCode 200
                     :body "Hello World"
                     :headers {"Content-Type" "text/plain"}})))