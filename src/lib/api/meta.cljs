(ns lib.api.meta)

(defn json->clj
  [content]
  (->> content (.parse js/JSON) js->clj))

(defn path-param
  [event key]
  (aget event "pathParameters" key))

(defn query-param
  [event key]
  ((aget event "queryStringParameters" key)))

(defn make-json-response 
  ([body] (make-json-response body 200))
  ([body code]
   (clj->js {:statusCode code
             :body (-> body clj->js js/JSON.stringify)
             :headers {"Content-Type" "application/json"}})))

(defn make-text-response
  ([body] (make-text-response body 200))
  ([body code]
   (clj->js {:statusCode code
             :body body
             :headers {"Content-Type" "text/plain"}})))

(defn with-secret
  [payload secret action]
  (let [provided ((:read secret) payload)
        value ((:get secret) payload)]
    (if (= provided value)
      (action payload)
      ((:callback payload)
       nil
       (make-text-response "Internal error" 501)))))
