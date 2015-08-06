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
var configSession= require('./config/session');
var configInet   = require('./config/inet');
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

//This part need to be called before bodyparser is enabled.
app.post("/*/_search", function(req, res){
    console.log("New proxy for _search");
    var incomingToken = req.headers.token;
    if (incomingToken) {
        Token.findUserByToken(incomingToken, function (err, user) {
            if (err) {
                console.log(err);
                res.json({error: err});
            }
            if (user) {
                apiProxy.web(req, res, { target: 'http://' + esConf.es_host +  ':' + esConf.es_port });
            } else {
                console.log("ERROR: Could not find a valid user for the token");
                res.send({});
                res.end();
            }
        });
    } else {
        console.log("ERROR: Token is not received!");
        res.send({});
        res.end();
    }
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
                console.log("ERROR: Could not find a valid user for the token");
                res.send({});
                res.end();
            }
        });
    } else {
        console.log("ERROR: Token is not received!");
        res.send({});
        res.end();
    }
});

app.get('/controls/api/:id', function(req, res) {
    var incomingToken = req.headers.token;
    console.log('incomingToken: ' + incomingToken + ' for /controls/api/:id GET');
    if (incomingToken) {
        Token.findUserByToken(incomingToken, function (err, user) {
            if (err) {
                console.log(err);
                res.json({error: err});
            }
            if (user) {
                res.send(JSON.stringify(yml.getYMLConf(parseInt(req.params.id))));
                res.end();
            } else {
                console.log("ERROR: Could not find a valid user for the token")
                res.send({});
                res.end();
            }
        });
    } else {
        console.log("ERROR: Token is not received!");
        res.send({});
        res.end();
    }
});

app.post('/controls/api/:id', function(req, res) {
    var incomingToken = req.headers.token;
    console.log('incomingToken: ' + incomingToken + ' for /controls/api/:id POST');
    if (incomingToken) {
        Token.findUserByToken(incomingToken, function (err, user) {
            if (err) {
                console.log(err);
                res.json({error: err});
            }
            if (user) {
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
            } else {
                console.log("ERROR: Sending null yml list for POST");
                res.send({});
                res.end();
            }
        });
    } else {
        console.log("ERROR: Token is not received!");
        res.send({});
        res.end();
    }
});

// required for passport
// redis options
var options = {sentinels: [{ host: configSession.sentinel.host1,
                             port: configSession.sentinel.port1 },
                           { host: configSession.sentinel.host2,
                             port: configSession.sentinel.port2 },
                           { host: configSession.sentinel.host3,
                             port: configSession.sentinel.port3 }],
    name: configSession.cluster.name};

// required for passport sessions
app.use(session({
    store: new RedisStore({ client: new Redis(options) }),
    secret: configSession.secret
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

var resHeaders = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Expose-Headers', 'token, status, user');

    if (req.isAuthenticated()) {
        console.log (req.user.local.email);
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

// Catch uncaught exceptions
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
  
  if ( err.toString().trim() == "Error: No valid replicaset instance servers found" ){
      console.log("Execute mongo cluster init")
      var child = exec('mongodb-configure.sh',
                       function (error, stdout, stderr) {
                           if (error !== null) {
                                console.log('exec error: ' + error);
                            }
                           if (stdout !== null) {
                                console.log('exec stdout: ' + stdout);
                           }
                           if (stderr !== null) {
                                console.log('exec stderr: ' + stderr);
                           }
                        });
  }
});

// launch ======================================================================
app.listen(port, configInet.addr);
console.log('The magic happens on port ' + port + ' at ' + configInet.addr);
