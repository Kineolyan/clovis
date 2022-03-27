(ns lib.aws.mail
  (:require ["aws-sdk" :as aws]
            [cljs.nodejs :as node]))

(enable-console-print!)

(def ses (aws/SES. (clj->js {"region" (aget node/process "env" "SES_REGION")})))

(defn ->two-digits [n] (if (< n 10) (str "0" n) n))

(def DAYS
  ["Sun",
   "Mon",
   "Tue",
   "Wed",
   "Thu",
   "Fri",
   "Sat"]);
(def MONTHS
  ["Jan",
   "Feb",
   "Mar",
   "Apr",
   "May",
   "Jun",
   "Jul",
   "Aug",
   "Sep",
   "Oct",
   "Nov",
   "Dec"]);

(defn ->date
  [d]
  ; Fri, 21 Nov 1997 09:55:06 -0600
  (let [day (.getDay d)
        weekDay (nth DAYS day)
        month (nth MONTHS (.getMonth d))
        year (.getFullYear d)
        hours (->two-digits (.getHours d))
        minutes (->two-digits (.getMinutes d))
        seconds (->two-digits (.getSeconds d))]
    (str weekDay ", " day " " month " " year " " hours ":" minutes ":" seconds " -0000")))

(defn write-mail
  [{:keys [destinators body subject originator]}]
  (clj->js {:Destination {:ToAddresses destinators}
            :Message {:Body {:Text {:Data body}}

                      :Subject {:Data subject}}

            :Source originator}))

(defn email-callback
  [resolve reject err]
  (if err
    (do (js/console.error "Cannot send email" err)
        (reject err))
    (resolve)))

(defn send-mail!
  "Sends an email using AWS Messages.
  Content requires the following keys: :destinators, :originator, :body :subject"
  [content]
  (let [e-params (write-mail content)]
    (js/Promise.
     (fn [resolve reject]
       (js/console.log "=== SENDING EMAIL ===")
       (.sendEmail ses e-params (partial email-callback resolve reject))))))
