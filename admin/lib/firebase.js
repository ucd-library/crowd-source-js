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
    this.firestore.settings({timestampsInSnapshots: true});
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
    if( typeof payload.schema === 'object' ) {
      payload.schema = JSON.stringify(payload.schema);
    }

    return this.firestore.collection(this.config.collections.schemas)
      .doc(payload.appId+'-'+payload.schemaId)
      .set(payload);
  }

  async listSchemas() {
    let querySnapshot = await this.firestore
      .collection(this.config.collections.schemas)
      .get();

    return (querySnapshot.docs || []).map(item => item.data());
  }

  async getSchema(appId, schemaId) {
    let item = await this.firestore
      .collection(this.config.collections.schemas)
      .doc(appId+'-'+schemaId)
      .get();

    if( !item.exists ) return null;
    return item.data();
  }


  removeSchema(appId, schemaId) {
    return this.firestore.collection(this.config.collections.schemas)
      .doc(appId+'-'+schemaId)
      .delete()
  }
}

module.exports = new Firebase();