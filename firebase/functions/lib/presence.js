const firebase = require('./firebase-admin');
const functions = require('firebase-functions');

const ROOT_PATH = 'presence';

class Presence {

  constructor() {
    this.firestore = firebase.firestore();

    // bind callbacks
    this._handleUpdate = this._handleUpdate.bind(this);
  }

  trigger() {
    return functions.database
      .ref(`/${ROOT_PATH}/{appId}/{uid}/{sessionId}`)
      .onUpdate(this._handleUpdate);
  }

  async _handleUpdate(change, context) {
    // It is likely that the Realtime Database change that triggered
    // this event has already been overwritten by a fast change in
    // online / offline status, so re-read data
    let firebasePresenceSnapshot = await change.after.ref.once('value');
    if( firebasePresenceSnapshot.exists() ) return;

    let querySnapshot = await this.firestore.collection(ROOT_PATH)
      .where('userId', '==', context.params.uid)
      .where('sessionId', '==', context.params.sessionId)
      .get();

    for( let doc of querySnapshot.docs ) {
      await this.firestore.collection(ROOT_PATH)
        .get(doc.id)
        .delete();
    }
  };

}

module.exports = new Presence();