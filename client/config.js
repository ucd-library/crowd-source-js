const GOOGLE_PROJECT_ID = 'price-the-vintage-dams';

module.exports = {
  appId : '',
  collectionId : '',

  fin : {
    host : 'https://digital.ucdavis.edu'
  },
  
  pgr : {
    host : 'http://localhost:6080'
  },

  firestore : {
    projectId : GOOGLE_PROJECT_ID,
    collections : {
      crowdInputs : 'crowd-inputs',
      presence : 'presence',
      schemas : 'schemas'
    },
    cloudFunctions : {
      host : `https://us-central1-${GOOGLE_PROJECT_ID}.cloudfunctions.net`,
      // host : 'http://localhost:5000/price-the-vintage-dams/us-central1',
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
    },
    domain : 'ucdlibrary.auth0.com', 
    clientID: '',
    scope : 'openid email profile',
    localStorageKeys : {
      profile : 'auth0-profile',
      redirectHash : 'auth-redirect-hash'
    },
    lockOptions : {
      auth : {
        autoParseHash: false,
        params: {
            responseType: 'token id_token',
            scope: 'openid mail profile'
        }
      },
      languageDictionary: {
        title: "Price the Vintage"
      },
      theme: {
        logo: '/images/library.png',
        primaryColor: '#912046'
      }
    },
    jwksUrl : 'https://ucdlibrary.auth0.com/.well-known/jwks.json'
  }
}