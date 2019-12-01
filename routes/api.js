/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
const MONGODB_CONNECTION_STRING = process.env.DB;

module.exports = function(app) {
  
  var db;
  MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, database) {
    if (err) throw err;
    db = database;
  });

  app
    .route("/api/threads/:board")
    .post(async function(req, res) {
      try {
        await db.collection("threads").insertOne(
          {
            board: req.params.board,
            text: req.body.text,
            delete_password: req.body.delete_password,
            reported: false,
            replies: [],
            created_on: new Date(),
            bumped_on: new Date()
          },
          err => {
            if (err) console.log(err);
            res.redirect(`/b/${req.params.board}/`);
          }
        );
      } catch (err) {
        console.log(err);
      }
    })

    .get(async function(req, res) {
      try {
        let result = await db
          .collection("threads")
          .aggregate([
            { $match: { board: req.params.board } },
            {
              $addFields: {
                replycount: { $size: "$replies" },
                replies: { $slice: ["$replies", -3, 3] }
              }
            },
            {
              $project: {
                delete_password: 0,
                reported: 0,
                "replies.delete_password": 0,
                "replies.reported": 0
              }
            },
            { $sort: { bumped_on: -1 } },
            { $limit: 10 }
          ])
          .toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    })

    .delete(async function(req, res) {
      try {
        await db
          .collection("threads")
          .findOne({ _id: ObjectId(req.body.thread_id) }, function(err, data) {
            if (err) console.log(err);
            if (data) {
              if (req.body.delete_password === data.delete_password) {
                db.collection("threads").deleteOne(
                  { _id: ObjectId(req.body.thread_id) },
                  err => {
                    if (err) console.log(err);
                    res.send("success");
                  }
                );
              } else {
                res.send("incorrect password");
              }
            }
          });
      } catch (err) {
        console.log(err);
      }
    })

    .put(async function(req, res) {
      try {
        await db
          .collection("threads")
          .updateOne(
            { _id: ObjectId(req.body.report_id) },
            { $set: { reported: true } },
            err => {
              if (err) console.log(err);
              res.send("success");
            }
          );
      } catch (err) {
        console.log(err);
      }
    });

  app
    .route("/api/replies/:board")
    .get(async function(req, res) {
      try {
        await db
          .collection("threads")
          .aggregate(
            [
              { $match: { _id: ObjectId(req.query.thread_id) } },
              {
                $project: {
                  delete_password: 0,
                  reported: 0,
                  "replies.delete_password": 0,
                  "replies.reported": 0
                }
              }
            ],
            (err, data) => {
              if (err) console.log(err);
              res.send(data[0]);
            }
          );
      } catch (err) {
        console.log(err);
      }
    })

    .post(async function(req, res) {
      try {
          let reply = {
          _id: ObjectId(),
          text: req.body.text,
          delete_password: req.body.delete_password,
          created_on: new Date(),
          reported: false
        };
        await db
          .collection("threads")
          .findOneAndUpdate(
            { _id: ObjectId(req.body.thread_id) },
            { $push: { replies: reply }, $set: { bumped_on: new Date() } },
            (err, data) => {
              if (err) console.log(err);
              res.redirect(`/b/${req.params.board}/${req.body.thread_id}`);
            }
          );
      } catch (err) {
        console.log(err);
        res.send("Did not succeed");
      }
    })

    .put(async function(req, res) {
      try {
        db.collection("threads").updateOne(
          {
            _id: ObjectId(req.body.thread_id),
            "replies._id": ObjectId(req.body.reply_id)
          },
          { $set: { "replies.$.reported": true } }
        );
        res.send("success");
      } catch (err) {
        console.log(err);
        res.send("Did not succeed");
      }
    })

    .delete(async function(req, res) {
      try {
        await db
          .collection("threads")
          .updateOne(
            {
              _id: ObjectId(req.body.thread_id),
              replies: {
                $elemMatch: {
                  _id: ObjectId(req.body.reply_id),
                  delete_password: req.body.delete_password
                }
              }
            },
            { $set: { "replies.$.text": "[deleted]" } },
            (err, data) => {
              if (err) console.log(err);
              if (data.modifiedCount === 0) {
                res.send("incorrect password");
              } else {
                res.send("success");
              }
            }
          );
      } catch (err) {
        res.send("did not succeed");
        console.log(err);
      }
    });
};
