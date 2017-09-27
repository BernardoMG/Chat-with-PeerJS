// app/routes.js

module.exports = function (app, passport) {
    // =====================================
    // HOME PAGE (with login links)
    // =====================================
  app.get('/', function (req, res) {
    res.render('login', {
      message: req.flash('loginMessage')
    })
  })

    // LOGOUT ==============================
  app.get('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
  })

    // PROFILE SECTION =========================
  app.get('/app', isLoggedIn, function (req, res) {
    res.render('profile', {
      user: req.user // get the user out of session and pass to template
    })
  })

    // =============================================================================
    // AUTHENTICATION SYSTEM
    // =============================================================================

    // FACEBOOK -------------------------------
        // Authentication Request
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: 'email'
  }))

        // Authentication Callback
  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/app',
    failureRedirect: '/'
  }))

    // GOOGLE -------------------------------
        // Authentication Request
  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }))

        // Authentication Callback
  app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/app',
    failureRedirect: '/'
  }))

    // LOCAL -------------------------------
        // Login
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/app',
    failureRedirect: '/',
    failureFlash: true
  }))

        // Signup
        // Signup Request
  app.get('/signup', function (req, res) {
    res.render('sigup', {
      message: req.flash('signupMessage')
    })
  })

        // Signup Process
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/app',
    failureRedirect: '/signup',
    failureFlash: true
  }))
}

// route middleware to make sure a user is logged in
function isLoggedIn (req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect('/')
  }
}
