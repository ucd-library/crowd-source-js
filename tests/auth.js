const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const firestore = require('../lib/firestore');
const deepEqual = require('fast-deep-equal');
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
        firestoreJwt : await this.createFirestoreJwt('alice@test.org'),
        pgrJwt : this.createPgrJwt('alice@test.org', '')
      },
      bob : {
        userId : 'bob@test.org',
        firestoreJwt : await this.createFirestoreJwt('bob@test.org'),
        pgrJwt : this.createPgrJwt('bob@test.org', '')
      },
      admin : {
        userId : 'admin@test.org',
        firestoreJwt : await this.createFirestoreJwt('admin@test.org', true),
        pgrJwt : this.createPgrJwt('admin@test.org', 'admin')
      },
      anonymous : {
        userId : 'foo@test.org',
        firestoreJwt : await this.createFirestoreJwt('anonymous@test.org', false, true),
        pgrJwt : this.createPgrJwt('anonymous@test.org', 'anon', false)
      },
    }
  }

  async createFirestoreJwt(userId, isAdmin=false, isAnonymous=false) {
    let claim = {isAdmin, isAnonymous};

    // TODO: assign guid for userId of anonymous? 

    try {
      let user = (await admin.auth().getUser(userId)).toJSON();
      if( !deepEqual(claim, user.customClaims) ) {
        await admin.auth().setCustomUserClaims(userId, claim);
      }
    } catch(e) {
      await admin.auth().createUser({uid: userId});
      await admin.auth().setCustomUserClaims(userId, claim);
    }

    await admin.auth().setCustomUserClaims(userId, claim);
    return admin.auth().createCustomToken(userId, claim);
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
      assert.equal(Object.keys(Users).length, 4);
    });
  });
});