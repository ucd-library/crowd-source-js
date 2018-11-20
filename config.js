const GOOGLE_PROJECT_ID = 'price-the-vintage-dams';

module.exports = {
  appId : '',
  
  fin : {
    host : 'https://digital.ucdavis.edu'
  },
  
  pgr : {
    host : 'http://localhost:3000'
  },

  firestore : {
    projectId : GOOGLE_PROJECT_ID,
    collections : {
      crowdInputs : 'crowd-inputs',
      presence : 'presence'
    },
    cloudFunctions : {
      host : `https://us-central1-${GOOGLE_PROJECT_ID}.cloudfunctions.net`,
      rootPath : '/api',
      methods : {
        userTokens : 'user-tokens',
        anonymousTokens : 'anonymous-tokens'
      }
    }
  },

  auth0 : {
    autoRenew : {
      enabled : true,
      path : '/silent-login.html'
    }
  }
}