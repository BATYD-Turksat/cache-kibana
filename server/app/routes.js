module.exports = function(app, passport) {
var User       = require('./models/user');

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/', function(req, res) {
        if (req.isAuthenticated()) {
            var user = req.user;
            user.hasRole('admin', function (err, isAdmin) {
                if (isAdmin){
                    res.redirect('/kibana');
                } else {
                    res.render('index.ejs');
                }
            });
        } else {
            res.render('index.ejs');
        }
	});

	// PROFILE SECTION =========================
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user
		});
	});

	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
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
			res.render('login.ejs', { message: req.flash('loginMessage') });
		});

		// process the login form
		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/kibana', // redirect to the secure profile section
			failureRedirect : '/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

		// SIGNUP =================================
		// show the signup form
		app.get('/signup', function(req, res) {
            if (req.isAuthenticated()) {
                var user = req.user;
                user.hasRole('admin', function (err, isAdmin) {
                    console.log( "Is user admin:", isAdmin );
                    if (isAdmin){
                        res.render('signup.ejs', { message: req.flash('signupMessage') });
                    } else {
                        res.redirect('/');
                    }
                });
            } else {
                User.count({}, function( err, count){
                    console.log( "Number of users:", count );
                    if (count == 0) {
                        res.render('signup.ejs', { message: req.flash('signupMessage') });
                    } else {
                        res.redirect('/');
                    }
                })
            }
        });

		// process the signup form
		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

	// locally --------------------------------
		app.get('/connect/local', function(req, res) {
			res.render('connect-local.ejs', { message: req.flash('loginMessage') });
		});
		app.post('/connect/local', passport.authenticate('local-signup', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', isLoggedIn, function(req, res) {
		var user            = req.user;
		user.local.user    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

// =============================================================================
// CACHE SERVER CONTROLS PAGE
// Only users with admin or developer privileges can see controls
// =============================================================================
    app.get('/controls', function(req, res) {
        if (req.isAuthenticated()) {
            var user = req.user;
            user.hasRole('operator', function (err, isOperator) {
                console.log( "Is user operator:", isOperator );

                if (isOperator){
                    res.redirect('/');
                } else {
                    res.render('controls.ejs');
                }
            });
        } else {
            res.redirect('/');
        }
    });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}
