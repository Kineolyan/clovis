Clovis, the Cloud Interface for Jarvis
===============

Features
----

 - Regularly send an email for tasks to run.

Installation
-----

Using NodeJS, importing everything for Clojure.
Setup `FAUNADB_TOKEN` and `STAGE` as env vars.

Development
-----

Run `bb repl-base` to compile from cljs to javascript.
Then run `bb repl-host` to create a NodeJS process to be the host for shadow REPL.

Releasing a new version
------

The serverless API is managed by the framework `serverless`. So far, there are only 2 stages for the API:

 - _dev_, used for the development of the new features
 - _prod_, for "production"-like deployment

For the two stages, corresponding scripts have been added to _package.json_. See `deploy:dev` and `deploy:prod`.
The preferred region is _eu-west-3_.
