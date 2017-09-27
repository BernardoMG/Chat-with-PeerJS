// Express Framework
const express = require('express')
const session = require('express-session')
const app = express()
app.set('view engine', 'pug')

// Socket IO
const server = require('http').createServer(app)
const io = require('socket.io')(server)

// Passport.js
const passport = require('passport')

// PeerJS Framework
const ExpressPeerServer = require('peer').ExpressPeerServer

// WebServer Tools
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const URL = 'room://state-of-the-art/'

// Mongoose is object modeling for our MongoDB database
const mongoose = require('mongoose')
var configDB = require('./config/database.js')
mongoose.connect(configDB.url)

// load up the user model
const User = require('./app/models/user')

// load the auth variables
const configAuth = require('./config/credentials')

// Sockets cache
const socketList = []

// Loading Time Test Data
const loadingData = []

//* *****************************************************************************
//
//* *****************************************************************************
const options = {
  debug: true
}

app.use('/peerjs', ExpressPeerServer(server, options))
app.use(cookieParser()) // read cookies (needed for auth)
app.use(bodyParser()) // get information from html forms

// required for passport
app.use(session({
  secret: configAuth.Cookie.secret,
  resave: true,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session()) // persistent login sessions
app.use(flash()) // use connect-flash for flash messages stored in session
app.use(express.static(__dirname))

require('./app/routes.js')(app, passport) // load our routes and pass in our app and fully configured passport
require('./config/passport')(passport) // pass passport for configuration

server.listen(9000, function () {
  console.log('listening on *:9000')
})

// Socket IO
io.on('connection', function (socket) {
  socketList.push(socket)

  socket.on('ID request', function (msg) {
    discoverPeerID(msg, socket.id)
  })
  socket.on('URL request', function (msg) {
    generateChatURL(msg, socket.id)
  })
  socket.on('URL search', function (msg) {
    searchChatURL(msg, socket.id)
  })

  socket.on('disconnect', function () {
    let index = socketList.indexOf(socket)
    socketList.splice(index, 1)
  })

  // Loading Time Test
  // socket.on('save time', function (msg) {
  //   let id = socket.id
  //   loadingData.push({time: msg})
  //   socketList.map((socket) => {
  //     if (socket.id === id) { return socket.emit('save time response', loadingData) }
  //   })
  // })
})

function discoverPeerID (email, id) {
  console.log('DISCOVER ID: ', email)
  User.findOne({ 'account.email': email }, function (err, user) {
    let peerID
    if (err) { console.log('[ERROR discoverPeerID]: ' + err) }
    if (user && user.account.google.active === true) {
      peerID = user.account.id
    } else if (user && user.account.facebook.active === true) {
      peerID = user.account.id
    } else if (user && user.account.local.active === true) {
      peerID = user.account.id
    }
    socketList.map((socket) => {
      if (socket.id === id) { return socket.emit('ID response', peerID) }
    })
  })
}

function generateChatURL (msg, id) {
  const url = URL + Math.floor(Math.random() * 90000) * 12345
  User.findOne({ 'account.email': msg.email }, function (err, user) {
    if (err) { console.log('[ERROR generateChatURL]: ' + err) }

    if (user) {
      let chat = {
        name: msg.name,
        url: url,
        ownerEmail: user.account.email
      }
      user.account.chat.push(chat)
      user.save((err) => {
        if (err) {
          console.log('[ERROR generateChatURL]: Something went wrong with MongoDB: ' + err)
        }
      })
      socketList.map((socket) => {
        if (socket.id === id) { return socket.emit('URL response', chat) }
      })
    } else {
      console.log('[ERROR generateChatURL]: No user found!')
    }
  })
}

function searchChatURL (msg, id) {
  User.findOne({ 'account.chat.url': msg }, function (err, user) {
    if (err) { console.log('[ERROR searchChatURL]: ' + err) }

    if (user) {
      user.account.chat.map((chatObj) => {
        if (chatObj.url === msg) {
          socketList.map((socket) => {
            if (socket.id === id) { return socket.emit('URL search response', chatObj) }
          })
        }
      })
    } else {
      console.log('[ERROR generateChatURL]: No user found!')
    }
  })
}
