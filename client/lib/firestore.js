let firebase = require("firebase");

// Required for side-effects
require("firebase/firestore");
require("firebase/database");

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

  /**
   * @method signIn
   * @description sign in with custom JWT token
   * 
   * @param {String} jwtToken 
   * 
   * @returns {Promise}
   */
  async signIn(jwtToken) {
    await this.signOut();
    return this.firebase.auth().signInWithCustomToken(jwtToken);
  }

  /**
   * @method signOut
   * @description sign out of firebase
   */
  signOut() {
    return this.firebase.auth().signOut();
  }

}

module.exports = new Firestore();