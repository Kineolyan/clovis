(ns lib.fauna.auth
  (:require [cljs.nodejs :as node]
            ["faunadb" :as faunadb]))

(def client (atom nil))

(defn create-client
  []
  (let [token (aget node/process.env "FAUNADB_TOKEN")]
    (faunadb/Client. (clj->js {:secret token}))))

(defn get-client
  []
  (swap! client #(or % (create-client))))
