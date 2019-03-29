Clovis, the Cloud Interface for Jarvis
===============

Features
----

 - Record the presence of home devices in a Google Spreadsheet
 - Regularly check that the home has not powered down

TODOs
-----

 - [ ] Add an entry point to record a new movie to watch
 - [ ] Add a entry point to fetch the current status of the home
  
Installation
-----

The serverless operations uses a Google service account. 

 1. Create one in the Google Project Dashboard
 2. Create and download a new JSON credential file.
 3. Add the credential file under _./.secret_ - ignored by git.
 4. Share the spreadsheet to use with the created service account

Releasing a new version
------

The serverless API is managed by the framework `serverless`. So far, there are only 2 stages for the API: 

 - _dev_, used for the development of the new features
 - _prod_, for "production"-like deployment

For the two stages, corresponding scripts have been added to _package.json_. See `deploy:dev` and `deploy:prod`. 
The preferred region is _eu-west-3_.
