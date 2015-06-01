module.exports = function(app, passport) {
var User       = require('./models/userModel');
var Token      = require('./models/tokenModel');

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/', function(req, res) {
        if (req.isAuthenticated()) {
            var user = req.user;

            // Create web token
            Token.createToken(user.local.email, function(err, token){
                if (err) {
                    console.log(err);
                }
            });

            res.cookie('user-name', user.local.email, { maxAge: 2592000000 });

            if (user.local.role == 'admin'){
                res.cookie('user-role', 'admin', { maxAge: 2592000000 });
            } else if (user.local.role == "developer") {
                res.cookie('user-role', 'developer', { maxAge: 2592000000 });
            } else {
                res.cookie('user-role', 'operator', { maxAge: 2592000000 });
            }
            res.redirect('/kibana/#/dashboard/file/performance_ats1.json');
        } else {
            res.clearCookie('user-name');
            res.clearCookie('user-role');
            res.redirect('/login');
        }
	});

	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
        Token.invalidateToken(req.user.local.email, function(err, token){
            if (err) {
                console.log(err);
            }
        });
		req.logout();
		res.redirect('/');
	});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form
		app.get('/login', function(req, res) {
            User.count({}, function( err, count){
                if (count == 0) {
                    res.redirect('/signup');
                } else {
                    res.render('login.html', { message: req.flash('loginMessage') });
                }
            });
		});

		// process the login form
		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/', // redirect to the secure profile section
			failureRedirect : '/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

		// SIGNUP =================================
		// show the signup if no user is registered. Note: First user is by default admin.
		app.get('/signup', function(req, res) {
            User.count({}, function( err, count){
                if (count == 0) {
                    res.render('signup.html', { message: req.flash('signupMessage') });
                } else {
                    res.redirect('/');
                }
            })
        });

		// process the signup form
		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/admin', // redirect to the secure admin section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

// =============================================================================
// CACHE SERVER CONTROLS PAGE
// Only users with admin or developer privileges can see controls
// =============================================================================
    app.get('/controls', function(req, res) {
        if (req.isAuthenticated()) {
            var user = req.user;
            if (user.local.role == 'operator'){
                res.redirect('/');
            } else {
                res.render('controls.html');
            }
        } else {
            res.redirect('/');
        }
    });

    //TODO: Enable authentication for the rest API
    app.get('/rest', function(req, res) {
        console.log(app.yml_conf);
        res.send(JSON.stringify(app.yml_conf));
        res.end();
    });


// =============================================================================
// ADMIN CONTROL PAGE
// Only admin privileges can see controls
// =============================================================================
    app.get('/admin', function(req, res) {
        if (req.isAuthenticated()) {
            var user = req.user;
            if (user.local.role == 'admin'){
                var static_roles = [ 'developer','admin','operator'];
                User.find({},function(err, users){
                    res.render('admin.html',{
                        app_users : users,
                        roles : static_roles,
                        message: req.flash('adminMessage')
                    });
                });
            } else {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }
    });

    // =============================================================================
    // DELETE USER LINK
    // Only admin privileges can delete
    // =============================================================================
    app.get('/delete/user/:user_id', function(req, res) {
        if (req.isAuthenticated()) {
            var user_id = req.params.user_id;
            var user = req.user;
            if (user.local.role == 'admin') {
                if (user["_id"] == user_id) {
                    req.flash('adminMessage', 'Can not delete self!');
                    res.redirect('/admin');
                } else {
                    User.findOne({ '_id': user_id }, function (err, user_in_db) {
                        User.remove({'_id': user_id}, function (error, result) {
                            if (err) {
                                console.log(err);
                                req.flash('adminMessage', err);
                            }
                        });
                        res.redirect('/admin');
                    });
                }
            } else {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }
    });

    // =============================================================================
    // REGISTER NEW USER
    // Only admin privileges can add new user
    // =============================================================================

    app.post('/register',  function(req, res) {
        if (req.isAuthenticated()) {
            var user = req.user;

            if (user.local.role == 'admin'){
                if (req.body.email) {
                    var email = req.body.email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
                }
                // asynchronous
                process.nextTick(function() {
                    User.findOne({ 'local.email' :  email }, function(err, user) {
                        // if there are any errors, return the error
                        if (err) {
                            console.log(err);
                            req.flash('adminMessage', err);
                        }
                        // check to see if there is already a user with that name
                        if (user) {
                            req.flash('adminMessage', user + ' is already taken.');
                        } else {
                            // create the user
                            var newUser            = new User();

                            newUser.local.email     = email;
                            newUser.local.password = newUser.generateHash(req.body.password);
                            newUser.local.role     = req.body.role.toLowerCase();
                            newUser.save(function(err) {
                                if (err) {
                                    console.log(err);
                                    req.flash('adminMessage', err);
                                }
                            });
                        }
                        res.redirect('/admin');
                    });
                });
            } else {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }
    });

    // =============================================================================
    // Token API                                                       =============
    // =============================================================================

    // Authenticates with the session cookie. This api should be called after login
    // in a web applications.
    app.get('/api/token/generate', function(req, res) {
        if (req.isAuthenticated()) {
            console.log("This is the e-mail: " + req.user.local.email);
            Token.createToken(req.user.local.email, function (err, token) {
                if (err) {
                    console.log(err);
                    res.json({error: err});
                } else {
                    res.json({
                        email: token.email,
                        token: token.token
                    });
                }
            });
        } else {
            res.json({error: "You need to login first"});
        }
    });

    app.get('/api/token/invalidate', function(req, res) {
        if (req.isAuthenticated()) {
            Token.invalidateToken(req.user.local.email, function (err, token) {
                if (err) {
                    console.log(err);
                    res.json({error: err});
                } else {
                    res.json({
                        email: token.email,
                        token: token.token
                    });
                }
            });
        } else {
            res.json({error: "You need to login first"});
        }
    });

    app.get('/api/token/test', function(req, res) {
        console.log(req);
        var incomingToken = req.headers.token;
        console.log('incomingToken: ' + incomingToken);
        Token.findUserByToken(incomingToken, function (err, user) {
            if (err) {
                console.log(err);
                res.json({error: err});
            } else {
                res.json({
                    log: {
                        user: user,
                        message: "This is just a simulation of an API endpoint"
                    }
                });
            }
        });
    });
};