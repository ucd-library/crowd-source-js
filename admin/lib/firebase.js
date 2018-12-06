const admin = require('firebase-admin');
const config = require('../config');
const deepEqual = require('deep-equal');

class Firebase {

  constructor() {
    this.config = config.firebase;
  }

  init() {
    this.serviceAccount = require(config.firebase.serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(this.serviceAccount),
    });

    this.firestore = admin.firestore();
    this.admin = admin;
  }

  async createJwt(userId, isAdmin=false, isAnonymous=false) {
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

  setWebhooks(appId, webhooks) {
    return this.firestore.collection(this.config.collections.appConfig)
      .doc(appId)
      .set({webhooks}, {merge:true})
  }

  setSchema(payload) {
    return this.firestore.collection(this.config.collections.schemas)
      .doc(payload.app_id+'-'+payload.schema_id)
      .set({schema: payload.schema});
  }

  listSchemas() {
    return this.firestore.collection(this.config.collections.schemas)
      .get();
  }

  removeSchema(appId, schemaId) {
    return this.firestore.collection(this.config.collections.schemas)
      .doc(appId+'-'+schemaId)
      .delete()
  }
}

module.exports = new Firebase();