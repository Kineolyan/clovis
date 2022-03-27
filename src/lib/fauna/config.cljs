(ns lib.fauna.config
  (:require [cljs.nodejs :as node]))

(defn create-prefixer
  [stage]
  (case stage
    "prod" identity
    "test" (partial str "test-")
    "dev" (partial str "dev-")))

(def prefix (create-prefixer (aget node/process "env" "STAGE")))

(def meal-collection (prefix "meals"))
(def meal-index (prefix "meal-list"))

