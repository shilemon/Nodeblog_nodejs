// Top of file - Add dotenv first
require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
// var multer = require('multer');

// Updated MongoDB connection with environment variable
var mongo = require('mongodb');
var db = require('monk')(process.env.MONGODB_URI || 'localhost/nodeblog');

var flash = require('connect-flash');
var routes = require('./routes/index');
var categories = require('./routes/categories');
var posts = require('./routes/posts');

const { body, validationResult } = require('express-validator');

var app = express();

// Your existing custom template helpers
app.locals.moment = require('moment');
app.locals.truncateText = function(text, length) {
  return text.substring(0, length);
};

// View engine setup (unchanged from yours)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware (keeping your setup but adding security)
// app.use(multer({ dest: './public/images/uploads' }).single('thumbimage'));
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Enhanced session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'sonic', // Now uses env variable
  saveUninitialized: false, // Changed from true for security
  resave: false, // Changed from true for security
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Auto HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Your flash messages setup (unchanged)
app.use(flash());
app.use(function(req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Your db middleware with added error handling
app.use(function(req, res, next) {
  req.db = db;
  // Verify DB connection
  db.then(() => next()).catch(err => {
    console.error('Database connection error:', err);
    res.status(500).render('error', {
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  });
});

// Your existing routes (completely unchanged)
app.use('/', routes);
app.use('/posts', posts);
app.use('/categories', categories);

// Your error handlers (unchanged but now with env check)
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Server startup with enhanced handling
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`   Access at: http://localhost:${PORT}`);
  console.log(`   MongoDB: ${process.env.MONGODB_URI || 'localhost/nodeblog'}`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  server.close(() => {
    db.close();
    console.log('Server stopped gracefully');
    process.exit(0);
  });
});

module.exports = app;
