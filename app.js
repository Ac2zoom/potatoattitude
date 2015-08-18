/*
	Copyright 2015, Google, Inc. 
 Licensed under the Apache License, Version 2.0 (the "License"); 
 you may not use this file except in compliance with the License. 
 You may obtain a copy of the License at 
  
    http://www.apache.org/licenses/LICENSE-2.0 
  
 Unless required by applicable law or agreed to in writing, software 
 distributed under the License is distributed on an "AS IS" BASIS, 
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 See the License for the specific language governing permissions and 
 limitations under the License.
*/
"use strict";

var config = require('./config');

var cons = require('consolidate');

var express = require('express');

var app = express();

app.engine('html', cons.swig);

app.use(require('./lib/appengine-handlers'));

var model = require("./model-mongodb")(config);
app.use('/api', require('./api')(model));

function create(data, cb) {
    model.getCollection(function(err, collection) {
      if (err) return cb(err);
      collection.insert(data, {w: 1}, function(err, result) {
        if (err) return cb(err);
        var item = model.fromMongo(result.ops);
        cb(null, item);
      });
    });
  }

app.get('/', function(req, res) {
  // res.render('hello', "index.html");
  res.sendFile(__dirname + '/index.html');
});
app.use('/static', express.static('app'));


app.post('/post_location', function(req, res) {
  console.log(req);
  //document = {song: req.body.song, artist: req.body.artist}
  create(null, function(err, entity) {
      if (err) return handleRpcError(err, res);
      res.json(entity);
    });
});

var server = app.listen(process.env.PORT || '8080', '0.0.0.0', function() {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
  console.log("Press Ctrl+C to quit.");
});