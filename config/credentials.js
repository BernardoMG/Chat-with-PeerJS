// expose our config directly to our application using module.exports

module.exports = {

    'Facebook' : {
        'clientID'        : '1789170698080095', // your App ID
        'clientSecret'    : '500be87428d1f344558d5402659bb4f2', // your App Secret
        'callbackURL'     : '/auth/facebook/callback'
    },

    'Google' : {
        'clientID'         : '740499000624-0qflm6ga36qm4lftl69p648609fqdude.apps.googleusercontent.com',
        'clientSecret'     : 'MOfU7_fyA0dGKsaEJU5l40XO',
        'callbackURL'      : '/auth/google/callback'
    },
    'Cookie' : {
        'secret'           : '12345678987654321'
    }

};
