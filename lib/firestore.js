let firebase = require("firebase");

// Required for side-effects
require("firebase/firestore");

class Firestore {

  constructor() {
    this.updateFirebase(firebase);
  }

  /**
   * @method updateFirebase
   * @description used to inject new firebase instance (most likely admin utility)
   * 
   * @param {*} firebase 
   */
  updateFirebase(firebase) {
    this.firebase = firebase;
  }

  initializeApp(options) {
    this.firebase.initializeApp(options);
    this.db = this.firebase.firestore();

    // Disable deprecated features
    this.db.settings({
      timestampsInSnapshots: true
    });
  }

  signIn(token) {
    this.signOut();
    return this.firebase.auth().signInWithCustomToken(token);
  }

  signOut() {
    this.firebase.auth().signOut();
  }

}

module.exports = new Firestore();