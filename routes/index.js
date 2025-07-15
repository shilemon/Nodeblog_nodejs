var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var db = require('monk')('localhost/nodeblog');

/* GET home page. */
router.get('/', function(req, res, next) {
  var posts = db.get('posts');

  posts.find({}, {}, function(err, posts) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send("Database error occurred.");
    }
    res.render('index', {
      title: "Home",
      posts: posts
    });
  });
});

module.exports = router;
