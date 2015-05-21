// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8081;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var util     = require('util');
var exec     = require('child_process').exec;

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var RedisStore   = require('connect-redis')(session);
var Redis        = require('ioredis');

var swig         = require('swig');
var configDB     = require('./config/database');
var configYML    = require('./config/yml');
var yml          = require('./app/yaml/yml-parser');


// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// attach the yml files to application.
var yml_path = './yml';
yml.readAllYML(yml_path);

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
app.get('/controls/api/confs', function(req,res) {
    res.send(JSON.stringify(yml.getYMLConfList()));
    res.end();
});

app.get('/controls/api/:id', function(req, res) {
    res.send(JSON.stringify(yml.getYMLConf(parseInt(req.params.id))));
    res.end();
});

app.post('/controls/api/:id', function(req, res) {
    yml.updateYML(req.params.id, req.body, function() {
    var child = exec(configYML.command_base + ' ' + configYML.command_params,
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
            res.send("Server Says:<br><br>" + stdout + "<br>" + stderr);
            res.end();
        });
    });
});

// required for passport
// redis options
var options = {sentinels: [{ host: '127.0.0.1', port: 26379 }, { host: '127.0.0.1', port: 26380 },  { host: '127.0.0.1', port: 26381 }],
    name: 'mymaster'};

// required for passport sessions
app.use(session({
    store: new RedisStore({ client: new Redis(options) }),
    secret: process.env.CACHE_COOKIE
}));
console.log("Cookie secret: " + process.env.CACHE_COOKIE);
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
