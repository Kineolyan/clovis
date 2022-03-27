(ns lib.fauna.query
  (:require ["faunadb" :as faunadb])
  (:refer-clojure :exclude [Var]))

;;; Export internal FaunaDB API for queries

(def Get faunadb/query.Get)
(def Create faunadb/query.Create)
(def Documents faunadb/query.Documents)
(def Collection faunadb/query.Collection)
(def Map faunadb/query.Map)
(def Paginate faunadb/query.Paginate)
(def Match faunadb/query.Match)
(def Filter faunadb/query.Filter)
(def Index faunadb/query.Index)
(def Lambda faunadb/query.Lambda)
(def Update faunadb/query.Update)
(def Ref faunadb/query.Ref)
(def Delete faunadb/query.Delete)

(def Var faunadb/query.Var)
(def Select faunadb/query.Select)

(def Date faunadb/query.Date)

(def LTE faunadb/query.LTE)

