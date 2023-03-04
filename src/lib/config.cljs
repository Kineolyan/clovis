(ns lib.config
  (:require [clojure.string :as str]))

(def base-url
  "https://kineolyan.gitlab.io/reading-buffer")

(defn -url
  [& parts]
  (str/join "/" (concat [base-url] parts)))

(def urls
  {:peter (-url "peter" "index.html")})
