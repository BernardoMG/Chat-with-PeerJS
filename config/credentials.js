// expose our config directly to our application using module.exports

module.exports = {

    'Facebook' : {
        'clientID'        : 'your App ID',
        'clientSecret'    : 'your App Secret', 
        'callbackURL'     : '/auth/facebook/callback'
    },

    'Google' : {
        'clientID'         : 'your App ID',
        'clientSecret'     : 'your App Secret',
        'callbackURL'      : '/auth/google/callback'
    },
    'Cookie' : {
        'secret'           : 'your-private-secret'
    }

};
