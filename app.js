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

var bodyParser = require('body-parser');

var app = express();

app.engine('html', cons.swig);

app.use(require('./lib/appengine-handlers'));

app.use(bodyParser.urlencoded());

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

function handleRpcError(err, res) {
    if (err.code == 404) return res.status(404);
    res.status(500).json({
      message: err.message,
      internalCode: err.code
    });
  }

function read(req, cb) {
    model.getCollection(function(err, collection) {
      if (err) return cb(err);
      collection.findOne({
        loc: {$near: [req.body.lat, req.body.lng]}
      }, function(err, result) {
        if (err) return cb(err);
        if (!result) return cb({
          code: 404,
          message: "Not found"
        });
        cb(null, fromMongo(result));
      });
    });
  }

app.get('/', function(req, res) {
  // res.render('hello', "index.html");
  res.sendFile(__dirname + '/index.html');
});
app.use('/static', express.static('app'));


app.post('/post_location', function(req, res) {
  var document = {song: req.body.song, artist: req.body.artist, loc:[req.body.lat, req.body.lng]};
  create(document, function(err, entity) {
      if (err) return handleRpcError(err, res);
      res.json(entity);
    });
});

app.post('/play', function(req, res) {
  res.json(read(req));
});

var server = app.listen(process.env.PORT || '8080', '0.0.0.0', function() {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
  console.log("Press Ctrl+C to quit.");
});