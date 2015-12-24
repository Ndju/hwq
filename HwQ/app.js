/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , submissions = require('./routes/submissions')
  , http = require('http')
  , path = require('path')
  , mysql = require('mysql')
  , async = require('async')
,uuid = require('node-uuid');


/**
 * Initialize express .
 */
var app = express();

app.use(express.static('public'));

app.configure(function(){
  app.set('port', process.env.PORT || 3001);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser('S3CRE7'));
  app.use(express.cookieSession());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});


/**
 * Initialize connections to mysql database depending on the NODE_ENV.
 */

console.log( "Starting in " + process.env.NODE_ENV );


app.configure('development', function() {
  console.log('Using development settings.');
  app.set('connection', mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    port: '3306',
    password: 'Welcome1'}));
  app.use(express.errorHandler());
});

app.configure('production', function() {
  console.log('Using production settings.');
  app.set('connection', mysql.createConnection({
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT}));
});



/**
 * Setup the mapping between the URL and the routes in Java Script objects.
 */

function init() {
  app.post('/login', user.login);
  app.post('/logout', user.logout); //TODO
  app.get('/query', submissions.query);

  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
}


// WHAT Is this anyway?
var client = app.get('connection');
async.series([
  function connect(callback) {
    client.connect(callback);
  },

  function use_db(callback) {
    client.query('USE user', callback);
  }

], function (err, results) {
  if (err) {
    console.log('Exception initializing database.');
    throw err;
  } else {
    console.log('Database initialization complete.');
    init();
  }
});

