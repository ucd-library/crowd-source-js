const firebase = require('./firebase-admin');
const functions = require('firebase-functions');
const request = require('./request');
const jwt = require('jsonwebtoken');

class Presence {

  constructor() {
    this.firestore = firebase.firestore();

    // bind callbacks
    this._handleUpdate = this._handleUpdate.bind(this);
  }

  trigger() {
    return functions.firestore
      .document(`/crowd_input/{crowdInputId}`)
      .onWrite(this._handleUpdate);
  }

  async _handleUpdate(change, context) {
    // Get an object with the current document value.
    // If the document does not exist, it has been deleted.
    let deleted = !change.after.exists;
    let document = change.after.exists ? change.after.data() : change.before.data();
    let payload = {deleted, document};

    // must have a registered appId
    if( !document.appId ) return;
    let config = await this.getAppConfig(document.id);
    
    if( !config.webhooks ) return;
    if( Array.isArray(config.webhooks) ) {
      config.webhooks = [config.webhooks];
    }
    if( webhooks.length === 0 ) return;

    let token = await firebase.auth()
      .createCustomToken('crowd-source-js', {from : 'firebase-cloud-function'});

    for( let url of config.webhooks ) {
      try {
        await request(url, {
          method : 'POST',
          headers : {
            'content-type' : 'application/json',
            authorization : `Bearer ${token}`
          },
          body : JSON.stringify(payload)
        })
      } catch(e) {
        console.error('Failed POST to webhook', url, e);
      }
    }

  };

  async getAppConfig(id) {
    let dataSnapshot = await this.firestore.collection('app-config')
    .doc(document.appId)
    .get();
    if( !dataSnapshot.exists ) return null;
    return dataSnapshot.data();
  }

}

module.exports = new Presence();