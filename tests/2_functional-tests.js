/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

let thread1;
let thread2;
let reply;
suite("Functional Tests", function() {
  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("Test POST /api/threads/:board => board page", function(done) {
        chai
          .request(server)
          .post("/api/threads/testboard")
          .send({ text: "Test text", delete_password: "password" })
          .end(function(err, res) {
            assert.match(
              res.redirects[0],
              /http:\/\/127.0.0.1:\d+\/b\/testboard\//
            );
            done();
          });
      });
    });

    suite("GET", function() {
      test("Test GET /api/threads/:board => array of 10 most recent threads", function(done) {
        chai
          .request(server)
          .get("/api/threads/testboard/")
          .end(function(err, res) {
            thread1 = res.body[0];
            thread2 = res.body[1];
            assert.equal(res.status, 200);
            assert.isArray(res.body, "response should be an array");
            assert.property(
              res.body[0],
              "_id",
              "Threads in array should contain _id"
            );
            assert.property(
              res.body[0],
              "text",
              "Threads in array should contain text"
            );
            assert.property(
              res.body[0],
              "created_on",
              "Threads in array should contain created_on"
            );
            assert.property(
              res.body[0],
              "bumped_on",
              "Threads in array should contain bumped_on"
            );
            assert.notProperty(
              res.body[0],
              "delete_password",
              "Threads in array should not contain delete_password"
            );
            assert.notProperty(
              res.body[0],
              "reported",
              "Threads in array should not contain reported"
            );
            assert.isAtMost(
              res.body.length,
              10,
              "There should be at most 10 threads in array"
            );
            assert.isAtMost(
              res.body[0].replies.length,
              3,
              "There should be at most 3 replies in each thread"
            );
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("Test DELETE /api/threads/:board => success deleting", function(done) {
        chai
          .request(server)
          .delete("/api/threads/testboard")
          .send({ thread_id: thread1._id, delete_password: "password" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, `success`);
            done();
          });
      });
    });

    suite("PUT", function() {
      test("Test PUT /api/threads/:board => success reporting", function(done) {
        chai
          .request(server)
          .put("/api/threads/testboard")
          .send({ report_id: thread2._id })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, `success`);
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("Test POST /api/replies/:board => thread page", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: "Reply",
            delete_password: "password",
            thread_id: thread2._id
          })
          .end(function(err, res) {
            assert.match(res.redirects[0], /http:\/\/127.0.0.1:\d+\/b\/test\/[a-f0-9]{12}/);
            done();
          });
      });
    });

    suite("GET", function() {
      test("Test GET /api/replies/:board => one thread with all replies", function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({ thread_id: thread2._id })
          .end(function(err, res) {
            reply = res.body.replies[res.body.replies.length - 1];
            assert.equal(res.status, 200);
            assert.isObject(res.body, "response should be an object");
            assert.property(
              res.body,
              "_id",
              "Threads in array should contain _id"
            );
            assert.property(
              res.body,
              "text",
              "Threads in array should contain text"
            );
            assert.property(
              res.body,
              "created_on",
              "Threads in array should contain created_on"
            );
            assert.property(
              res.body,
              "bumped_on",
              "Threads in array should contain bumped_on"
            );
            assert.notProperty(
              res.body,
              "delete_password",
              "Threads in array should not contain delete_password"
            );
            assert.notProperty(
              res.body,
              "reported",
              "Threads in array should not contain reported"
            );
            done();
          });
      });
    });

    suite("PUT", function() {
      test("Test PUT /api/replies/:board => success reporting reply", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .send({ thread_id: thread2._id, reply_id: reply._id })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, `success`);
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("Test DELETE /api/replies/:board => success deleting reply", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: thread2._id,
            reply_id: reply._id,
            delete_password: "password"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, `success`);
            done();
          });
      });
    });
  });
});
