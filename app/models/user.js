// load the things we need
var mongoose = require('mongoose')
var bcrypt = require('bcrypt-nodejs')

// define the schema for our user model
var userSchema = mongoose.Schema({

  account: {
    email: String,
    id: String,
    chat: [ {
      name: String,
      url: String,
      ownerEmail: String
    } ],
    facebook: {
      token: String,
      email: String,
      name: String,
      photo: String,
      active: Boolean
    },
    google: {
      token: String,
      email: String,
      name: String,
      photo: String,
      active: Boolean
    },
    local: {
      name: String,
      email: String,
      password: String,
      active: Boolean
    }
  }
})

// generating a hash
userSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

// checking if password is valid
userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.account.local.password)
}

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema)
