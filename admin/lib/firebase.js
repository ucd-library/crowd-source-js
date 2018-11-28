let admin = require('firebase-admin');

class Firebase {

  constructor() {
    this.firestore = admin.firestore();
  }

  init(serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  setWebhooks(appId, webhooks) {
    return this.firestore.collection('app-config')
      .doc(appId)
      .set({webhooks}, {merge:true})
  }
}

module.exports = new Firebase();