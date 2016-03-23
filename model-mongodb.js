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

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;


module.exports = function(config) {

  var url = "mongodb://user:password@ds033113.mongolab.com:33113/main";
  var collectionName = "songs";


  // [START translate]
  function fromMongo(item) {
    if (item.length) item = item.pop();
    item.id = item._id;
    delete item._id;
    return item;
  }


  function toMongo(item) {
    delete item.id;
    return item;
  }
  // [END translate]


  function getCollection(cb) {
    MongoClient.connect(url, function(err, db) {
      if (err) {
        console.log(err);
        return cb(err);
      }
      cb(null, db.collection(collectionName));
    });
  }


  // [START list]
  function list(limit, token, cb) {
    token = token ? parseInt(token, 10) : 0;
    getCollection(function(err, collection) {
      if (err) return cb(err);
      collection.find({})
        .skip(token)
        .limit(limit)
        .toArray(function(err, results) {
          if (err) return cb(err);
          cb(null, results.map(fromMongo), results.length === limit ? token + results.length : false);
        });
    });
  }
  // [END list]


  // [START create]
  function create(data, cb) {
    getCollection(function(err, collection) {
      if (err) return cb(err);
      collection.insert(data, {w: 1}, function(err, result) {
        if (err) return cb(err);
        var item = fromMongo(result.ops);
        cb(null, item);
      });
    });
  }
  // [END create]


  function read(id, cb) {
    getCollection(function(err, collection) {
      if (err) return cb(err);
      collection.findOne({
        _id: new ObjectID(id)
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


  // [START update]
  function update(id, data, cb) {
    getCollection(function(err, collection) {
      if (err) return cb(err);
      collection.update({
          _id: new ObjectID(id)
        }, {
          '$set': toMongo(data)
        },
        {w: 1},
        function(err) {
          if (err) return cb(err);
          return read(id, cb);
        }
      );
    });
  }
  // [END update]


  function _delete(id, cb) {
    getCollection(function(err, collection) {
      if (err) return cb(err);
      collection.remove({
        _id: new ObjectID(id)
      }, cb);
    });
  }

  return {
    getCollection: getCollection,
    create: create,
    read: read,
    update: update,
    delete: _delete,
    list: list,
    fromMongo: fromMongo
  };

};
