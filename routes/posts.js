const express = require('express');
const router = express.Router();
const mongo = require('mongodb');
const ObjectID = require('mongodb').ObjectID;
const db = require('monk')('localhost/nodeblog');
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get('/', function(req, res) {
  const posts = db.get('posts');
  posts.find({}, {}, function(err, posts) {
    res.render('index', { "posts": posts, "title": "Posts" });
  });
});

router.get('/show/:id', function(req, res) {
  const posts = db.get('posts');
  const id = new ObjectID(req.params.id);
  posts.findOne({ "_id": id }, {}, function(err, post) {
    if (err) throw err;
    res.render('showpost', {
      "title": post.title,
      "post": post
    });
  });
});

router.get('/edit/:id', function(req, res) {
  const posts = db.get('posts');
  const categories = db.get('categories');
  const id = new ObjectID(req.params.id);
  categories.find({}, {}, function(err, categories) {
    posts.findOne({ "_id": id }, {}, function(err, post) {
      if (err) throw err;
      res.render('editpost', {
        "title": post.title,
        "post": post,
        "categories": categories
      });
    });
  });
});

router.get('/add', function(req, res) {
  const categories = db.get('categories');
  categories.find({}, {}, function(err, categories) {
    res.render('addpost', {
      "title": "Add Post",
      "categories": categories
    });
  });
});

router.post('/addcomment', [
  body('title').notEmpty().withMessage('Title Field is required'),
  body('name').notEmpty().withMessage('Name Field is required'),
  body('body').notEmpty().withMessage('Body Field is required')
], function(req, res) {
  const errors = validationResult(req);
  const { title, name, postid, body: bodyContent } = req.body;
  const posts = db.get('posts');
  const id = new ObjectID(postid);

  if (!errors.isEmpty()) {
    posts.findOne({ "_id": id }, {}, function(err, post) {
      if (err) throw err;
      res.render('showpost', {
        "title": post.title,
        "post": post,
        "errors": errors.array()
      });
    });
  } else {
    const comment = {
      title,
      name,
      body: bodyContent,
      date: new Date()
    };

    posts.update({ "_id": id }, { $push: { "comments": comment } }, function(err) {
      if (err) throw err;
      req.flash('success', 'Comment created');
      res.redirect('/posts/show/' + postid);
    });
  }
});

router.post('/add', upload.single('thumbimage'), [
  body('title').notEmpty().withMessage('Title Field is required'),
  body('body').notEmpty().withMessage('Body Field is required')
], function(req, res) {
  const errors = validationResult(req);
  const { title, category, body: bodyContent } = req.body;
  const date = new Date();
  const thumbImageName = req.file ? req.file.filename : 'noimage.png';
  const posts = db.get('posts');

  if (!errors.isEmpty()) {
    const categories = db.get('categories');
    categories.find({}, {}, function(err, categories) {
      res.render('addpost', {
        "errors": errors.array(),
        "title": title,
        "body": bodyContent,
        "categories": categories
      });
    });
  } else {
    posts.insert({
      title,
      body: bodyContent,
      category,
      date,
      thumbimage: thumbImageName
    }, function(err) {
      if (err) {
        res.send("There was an issue submitting the post");
      } else {
        req.flash('success', 'Post Submitted');
        res.redirect('/');
      }
    });
  }
});

router.post('/edit', upload.single('thumbimage'), [
  body('title').notEmpty().withMessage('Title Field is required'),
  body('body').notEmpty().withMessage('Body Field is required')
], function(req, res) {
  const errors = validationResult(req);
  const { title, category, body: bodyContent, postId, previmage } = req.body;
  const date = new Date();
  const posts = db.get('posts');
  const categories = db.get('categories');
  const id = new ObjectID(postId);
  const thumbImageName = req.file ? req.file.filename : previmage;

  if (!errors.isEmpty()) {
    categories.find({}, {}, function(err, categories) {
      posts.findOne({ "_id": id }, {}, function(err, post) {
        if (err) throw err;
        res.render('editpost', {
          "errors": errors.array(),
          "title": post.title,
          "post": post,
          "categories": categories
        });
      });
    });
  } else {
    posts.update({ "_id": id }, {
      title,
      body: bodyContent,
      category,
      date,
      thumbimage: thumbImageName
    }, function(err) {
      if (err) {
        res.send("There was an issue Editing the post");
      } else {
        req.flash('success', 'Post Edited');
        res.redirect('/posts/show/' + postId);
      }
    });
  }
});

router.get('/delete/:id', function(req, res) {
  const posts = db.get('posts');
  const id = new ObjectID(req.params.id);
  posts.remove({ "_id": id }, function(err) {
    if (err) throw err;
    req.flash('success', 'Post Deleted');
    res.redirect('/');
  });
});

module.exports = router;
