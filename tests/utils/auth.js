const fs = require('fs');
const path = require('path');
const admin = require('../../admin/lib/firebase');
const pgr = require('../../admin/lib/pgr');
const firestore = require('../../client/lib/firestore');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const data = require('./data');

const pubKey = fs.readFileSync(path.resolve(__dirname, '..', 'service-account.pub'), 'utf-8');

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
const secrets = require('../secrets');

class AuthUtils {

  constructor() {
    admin.init();
    pgr.config.secret = secrets.pgr;

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
        firestoreJwt : await admin.createJwt('alice@test.org'),
        pgrJwt : pgr.createJwt('alice@test.org', '')
      },
      bob : {
        userId : 'bob@test.org',
        firestoreJwt : await admin.createJwt('bob@test.org'),
        pgrJwt : pgr.createJwt('bob@test.org', '')
      },
      admin : {
        userId : 'admin@test.org',
        firestoreJwt : await admin.createJwt('admin@test.org', true),
        pgrJwt : pgr.createJwt('admin@test.org', 'admin')
      },
      anonymous : {
        userId : 'foo@test.org',
        firestoreJwt : await admin.createJwt('anonymous@test.org', false, true),
        pgrJwt : pgr.createJwt('anonymous@test.org', 'anon', false)
      },
    }

    await data.cleanupPgr();
  }

}

let auth = new AuthUtils();
global.auth = auth;

describe('Authentication', function() {
  describe('Fake accounts', function(){
    it('should setup auth accounts', async function() {
      this.timeout(10000);
      await auth.init();
      assert.equal(Object.keys(Users).length, 4);
    });

    it('should verify firebase jwts are correct', async function() {
      for( let id in Users ) {
        let user = Users[id];
        try {
          jwt.verify(user.firestoreJwt, pubKey, {algorithms: ['RS256']});
          assert.equal(1,1);
        } catch(e) {
          assert.equal(e, null);
        }
      }
    });

    it('should verify pgr jwts are correct', async function() {
      for( let id in Users ) {
        let user = Users[id];
        try {
          jwt.verify(user.pgrJwt, pgr.config.secret);
          assert.equal(1,1);
        } catch(e) {
          assert.equal(e, null);
        }
      }
    });

  });

});