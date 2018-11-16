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
    this.db = firebase.firestore();

    // Disable deprecated features
    db.settings({
      timestampsInSnapshots: true
    });
  }

  initializeApp(options) {
    this.firebase.initializeApp(options);
  }

}

module.exports = new Firestore();