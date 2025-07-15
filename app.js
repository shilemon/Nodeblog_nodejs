var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
// var multer = require('multer');

var mongo = require('mongodb');
var db = require('monk')('localhost/nodeblog');

var flash = require('connect-flash');
var routes = require('./routes/index');
var categories = require('./routes/categories');
var posts = require('./routes/posts');

const { body, validationResult } = require('express-validator');

var app = express();

// Make moment available to templates
app.locals.moment = require('moment');

// Truncate text function for templates
app.locals.truncateText = function(text, length) {
  return text.substring(0, length);
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(multer({ dest: './public/images/uploads' }).single('thumbimage'));

// Uncomment if favicon is available
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Handle session
app.use(session({
  secret: 'sonic',
  saveUninitialized: true,
  resave: true
}));

// Flash messages
app.use(flash());
app.use(function(req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Make db accessible to router
app.use(function(req, res, next) {
  req.db = db;
  next();
});

// Routes
app.use('/', routes);
app.use('/posts', posts);
app.use('/categories', categories);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

module.exports = app;
