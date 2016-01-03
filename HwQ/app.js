/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , calendar = require('./routes/calendar')
  , submissions = require('./routes/submissions')
  , http = require('http')
  , path = require('path')
  , mysql = require('mysql')
  , async = require('async')
,uuid = require('node-uuid');

var bodyParser = require('body-parser');

/**
 * Initialize express .
 */
var app = express();
//allows static files to be expressed by typing the file name after url.
app.use(express.static('public'));

app.configure(function(){
  app.set('port', process.env.PORT || 3001);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  //app.use(express.bodyParser());
  //initializes cookie parser settings
  app.use(express.cookieParser('S3CRE7'));
  app.use(express.cookieSession());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.use(express.methodOverride());

/**
 * Initialize connections to mysql database depending on the NODE_ENV.
 */

console.log( "Starting in " + process.env.NODE_ENV );

//goes to environment variables and initializes either the test database or the mysql database
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


function checkAuth(req, res, next) {
	console.log(req.session.classList);
	if (!req.session.user) {
		console.log( "Require authorization." );
		res.redirect("/");
	} else {
		next();
	}
	
}


/**
 * Setup the mapping between the URL and the routes in Java Script objects.
 */

function init() {
	// if the url route is chosen, calls the function (the static file posts to the url)
  app.post('/login', bodyParser.urlencoded(), user.login);
  app.post('/logout', user.logout); //TODO
  app.get('/calendar',checkAuth, calendar.cal);
  app.get('/query', checkAuth, submissions.query);
  app.post('/reset', checkAuth, bodyParser.urlencoded(), user.reset);
  app.get('/assignments',checkAuth, calendar.assignments);
  app.post('/new-assignment', checkAuth, bodyParser.urlencoded(), calendar.newAssignments);
  app.post('/submission', checkAuth, calendar.submission);

  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
}

//Debug: print env vars
console.log(process.env);

//Test MySQL connection
var client = app.get('connection');
console.log( "Connecting to MySql=====> :  "+ client.config.user + "@" + client.config.host  );

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

