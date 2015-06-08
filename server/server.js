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
var Token        = require('./app/models/tokenModel');

// Elastic search
var esConf       = require('./config/elasticsearch');
var cfgESProxy   = require('./app/es_proxy').configureESProxy;
var httpProxy    = require('http-proxy');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./app/mwconf/passport')(passport); // pass passport for configuration

// attach the yml files to application.
var yml_path = './yml';
yml.readAllYML(yml_path);


// Elasticsearch node proxy setup
console.log("host");
console.log(esConf.es_host);
cfgESProxy(app, esConf.es_host, esConf.secure, esConf.es_port,
    esConf.es_username, esConf.es_password, esConf.others);
var apiProxy = httpProxy.createProxyServer();
console.log(esConf.es_host + ':' + esConf.es_port);

app.post("/*/_search", function(req, res){
  console.log("New proxy for _search");
  apiProxy.web(req, res, { target: 'http://' + esConf.es_host +  ':' + esConf.es_port });
});

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

//This part need to be called before session is enabled.
app.get('/controls/api/confs', function(req,res) {
    var incomingToken = req.headers.token;
    console.log('incomingToken: ' + incomingToken + ' for /controls/api/confs');
    if (incomingToken) {
        Token.findUserByToken(incomingToken, function (err, user) {
            if (err) {
                console.log(err);
                res.json({error: err});
            }

            if (user) {
                res.send(JSON.stringify(yml.getYMLConfList()));
                res.end();
            } else {
                console.log("ERROR: Sending null conf list")
                res.send({});
                res.end();
            }
        });
    } else {
        console.log("ERROR: Token is not received!")
        res.send({});
        res.end();
    }
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

var resHeaders = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Expose-Headers', 'token, status, user');

    if (req.isAuthenticated()) {
        console.log (req.user.local.email)
        Token.findTokenByUser(req.user.local.email, function(err, token){
           if(err || !token){
               console.log("Res header couldn't find token for user " , req.user.local.email);
           } else {
               res.header('token', token.token);
               res.header('user', token.email);
               res.header('status', 'login');
           }
           next()
        })
    } else {
        next();
    }
};

app.use(resHeaders);


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


app.get("/*/_mapping", function(req, res){
    if (req.isAuthenticated()) {
        apiProxy.web(req, res, { target: 'http://' + esConf.es_host + ':' + esConf.es_port });
    } else {
        res.redirect('/login');
    }
});


app.get("/*/_aliases", function(req, res){
    if (req.isAuthenticated()) {
        apiProxy.web(req, res, { target: 'http://' + esConf.es_host + ':' + esConf.es_port });
    } else {
        res.redirect('/login');
    }
});


app.get("/_nodes", function(req, res){
    if (req.isAuthenticated()) {
        apiProxy.web(req, res, { target: 'http://' + esConf.es_host + ':' + esConf.es_port });
    } else {
        res.redirect('/login');
    }
});


app.get("/_plugin", function(req, res){
    if (req.isAuthenticated()) {
        apiProxy.web(req, res, { target: 'http://' + esConf.es_host + ':' + esConf.es_port });
    } else {
        res.redirect('/login');
    }
});


app.get("/__es", function(req, res){
    if (req.isAuthenticated()) {
        apiProxy.web(req, res, { target: 'http://' + esConf.es_host + ':' + esConf.es_port });
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
