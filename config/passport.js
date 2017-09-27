const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const LocalStrategy = require('passport-local').Strategy

// load up the user model
var User = require('../app/models/user')

// load the auth variables
var configAuth = require('./credentials')

module.exports = function (passport) {
  // used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id)
  })

  // used to deserialize the user
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user)
    })
  })

  // =========================================================================
  // LOCAL LOGIN
  // =========================================================================
  passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
    function (req, email, password, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function () {
        User.findOne({ 'account.email': email }, function (err, user) {
          if (err) { return done(err) }

          if (!user) {
            return done(null, false, req.flash('loginMessage', 'No user found.')) // req.flash is the way to set flashdata using connect-flash
          }

          if (!user.validPassword(password)) {
            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')) // create the loginMessage and save it to session as flashdata
          } else if (user && user.validPassword(password)) {
            if (!user.account.local.active) {
              user.account.google.active = false
              user.account.facebook.active = false
              user.account.local.active = true
              user.save((err) => {
                if (err) throw err
                return done(null, user)
              })
            } else {
              return done(null, user)
            }
          }
        })
      })
    }))

  // =========================================================================
  // LOCAL SIGNUP
  // =========================================================================
  passport.use('local-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
    function (req, email, password, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function () {
        User.findOne({ 'account.email': email }, function (err, user) {
          if (err) { return done(err) }
          if (user) {
            if (user.account.local.email) {
              return done(null, false, req.flash('signupMessage', 'That email is already taken.'))
            } else {
              user.account.local.email = email
              user.account.local.password = user.generateHash(password)
              user.account.local.name = req.body.name
              user.account.local.active = true
              user.account.facebook.active = false
              user.account.google.active = false
              user.save((err) => {
                if (err) throw err
                return done(null, user)
              })
            }
          } else {
              let newUser = new User()
              newUser.account.email = email
              newUser.account.local.email = email
              newUser.account.local.password = newUser.generateHash(password)
              newUser.account.local.name = req.body.name
              newUser.account.local.active = true
              newUser.account.facebook.active = false
              newUser.account.google.active = false
              newUser.account.id = newUser._id
              newUser.save((err) => {
                if (err) throw err
                return done(null, newUser)
              })
          }
        })
      })
    }))

  // =========================================================================
  // FACEBOOK
  // =========================================================================
  passport.use(new FacebookStrategy({
    clientID: configAuth.Facebook.clientID,
    clientSecret: configAuth.Facebook.clientSecret,
    callbackURL: configAuth.Facebook.callbackURL,
    profileFields: ['id', 'displayName', 'name', 'emails', 'picture.type(large)']
  },
    function (token, tokenSecret, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function () {
        User.findOne({ 'account.email': profile.emails[0].value }, function (err, user) {
          if (err) { return done(err) }

          if (user) {
            if (!user.account.facebook.active) {
              user.account.google.active = false
              user.account.facebook.active = true
              user.account.local.active = false
              user.account.facebook.token = token
              user.account.facebook.name = profile.displayName
              user.account.facebook.email = profile.emails[0].value // pull the first email
              user.account.facebook.photo = profile.photos[0].value
              user.save((err) => {
                if (err) throw err
                return done(null, user)
              })
            } else {
              return done(null, user)
            }
          } else {
            let newUser = new User()
            newUser.account.facebook.token = token
            newUser.account.facebook.name = profile.displayName
            newUser.account.facebook.email = profile.emails[0].value // pull the first email
            newUser.account.email = profile.emails[0].value
            newUser.account.id = newUser._id
            newUser.account.facebook.photo = profile.photos[0].value
            newUser.account.facebook.active = true
            newUser.account.google.active = false
            newUser.account.local.active = false
            newUser.save((err) => {
              if (err) throw err
              return done(null, newUser)
            })
          }
        })
      })
    }))

  // =========================================================================
  // GOOGLE
  // =========================================================================
  passport.use(new GoogleStrategy({
    clientID: configAuth.Google.clientID,
    clientSecret: configAuth.Google.clientSecret,
    callbackURL: configAuth.Google.callbackURL
  },
    function (token, refreshToken, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function () {
        User.findOne({ 'account.email': profile.emails[0].value }, function (err, user) {
          if (err) { return done(err) }

          if (user) {
            if (!user.account.google.active) {
              user.account.facebook.active = false
              user.account.google.active = true
              user.account.local.active = false
              user.account.google.token = token
              user.account.google.name = profile.displayName
              user.account.google.email = profile.emails[0].value // pull the first email
              user.account.google.photo = cleanPhotoURL(profile.photos[0].value)
              user.save((err) => {
                if (err) throw err
                return done(null, user)
              })
            } else {
              return done(null, user)
            }
          } else {
            let newUser = new User()
            newUser.account.id = newUser._id
            newUser.account.google.token = token
            newUser.account.google.name = profile.displayName
            newUser.account.google.email = profile.emails[0].value // pull the first email
            newUser.account.email = profile.emails[0].value
            newUser.account.google.photo = cleanPhotoURL(profile.photos[0].value)
            newUser.account.google.active = true
            newUser.account.facebook.active = false
            newUser.account.local.active = false
            newUser.save((err) => {
              if (err) throw err
              return done(null, newUser)
            })
          }
        })
      })
    }))
}

// Google Photo URL is send with a default size
function cleanPhotoURL (url) {
  const urlResult = url.split('?')
  return urlResult[0]
}
