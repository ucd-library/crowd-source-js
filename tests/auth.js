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
        firestore : await this.createFirestoreJwt('alice', 'alice@test.com'),
        pgr : this.createPgrJwt('alice', '')
      },
      bob : {
        firestore : await this.createFirestoreJwt('bob', 'bob@test.com'),
        pgr : this.createPgrJwt('bob', '')
      },
      admin : {
        firestore : await this.createFirestoreJwt('testing-admin', 'testing-admin@test.com', true),
        pgr : this.createPgrJwt('testing-admin', 'admin')
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