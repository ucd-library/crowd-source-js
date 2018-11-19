const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const firestore = require('../lib/firestore');
const assert = require('assert');

/**
 * Firebase service account
 */
const serviceAccount = require('./service-account');

/**
 * PGR and Firestore config, should look like:
 * 
 * {
 *  "pgr" : "[secret]",
 *  "firebase" : {
 *    "apiKey" : "",
 *    "projectId" : ""
 *   }
 * }
 */
const secrets = require('./secrets');

class AuthUtils {

  constructor() {
    admin.initializeApp({
      credential : admin.credential.cert(serviceAccount)
    });

    firestore.initializeApp({
      apiKey : secrets.firebase.apiKey,
      projectId : secrets.firebase.projectId,
      authDomain : `${secrets.firebase.projectId}.firebaseapp.com`
    });
  }

  async init() {
    global.Users = {
      alice : {
        userId : 'alice@test.org',
        firestoreJwt : await this.createFirestoreJwt('alice@test.org', 'alice@test.org'),
        pgrJwt : this.createPgrJwt('alice@test.org', '')
      },
      bob : {
        userId : 'bob@test.org',
        firestoreJwt : await this.createFirestoreJwt('bob@test.org', 'bob@test.org'),
        pgrJwt : this.createPgrJwt('bob@test.org', '')
      },
      admin : {
        userId : 'admin@test.org',
        firestoreJwt : await this.createFirestoreJwt('admin@test.org', 'admin@test.org', true),
        pgrJwt : this.createPgrJwt('admin@test.org', 'admin')
      }
    }
  }

  createFirestoreJwt(userId, email, isAdmin=false) {
    return admin.auth().createCustomToken(
      userId,
      {email, isAdmin}
    )
  }

  createPgrJwt(username, role) {
    return jwt.sign({username, role}, secrets.pgr);
  }

}

let auth = new AuthUtils();
global.auth = auth;

describe('Authentication', function() {
  describe('Fake accounts', function(){
    it('should setup auth accounts', async function() {
      await auth.init();
      assert.equal(Object.keys(Users).length, 3);
    });
  });
});