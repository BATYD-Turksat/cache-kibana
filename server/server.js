// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8081;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var swig         = require('swig');
var configDB     = require('./config/database');

var yml          = require('./app/yaml/yml-parser');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// attach the yml files to application.
var yml_file_name = 'sample2';
app.yml_conf = yml.readYML(yml_file_name);

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

// set .swg as the default extension
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// TODO: Need to check if it has any side-effect
app.set('trust proxy', 'localhost');
app.enable('trust proxy');


//TODO: Enable token based authentication for the rest API
//This part need to be called before session is enabled.
app.get('/controls/api', function(req, res) {
    res.send(JSON.stringify(app.yml_conf));
    res.end();
});

app.post('/controls/api', function(req, res) {
    yml.updateYML(req.body, yml_file_name);
    res.end();
});

// required for passport
console.log("Cookie secret: " + process.env.CACHE_COOKIE);
app.use(session({ secret: process.env.CACHE_COOKIE })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// kibana static file routes ===================================================

var staticMiddleware = express.static(__dirname + '/../src');
app.use("/kibana", function(req, res, next) {
    if (req.isAuthenticated()) {
        staticMiddleware(req, res, next);
    } else {
        res.redirect('/login');
    }
});

// 404  routes ===================================================
 app.use(function(req, res, next){
 res.status(404);

 // respond with html page
 if (req.accepts('html')) {
 res.render('404', { url: req.url });
 return;
 }

 // respond with json
 if (req.accepts('json')) {
 res.send({ error: 'Not found' });
 return;
 }

 // default to plain-text. send()
 res.type('txt').send('Not found');
 });

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
