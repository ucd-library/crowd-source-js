const {BaseService} = require('@ucd-lib/cork-app-utils');
const PresenceStore = require('../stores/presence-store');
const firestore = require('../lib/firestore');
const config = require('../config');
const uuid = require('uuid');

class PresenceService extends BaseService {

  constructor() {
    this.store = PresenceStore;
    this.collection = config.firestore.collections.presence;

    // a unique id for this client
    this.sessionClientId = uuid.v4();

    this.firebase = this.firestore.firebase;
    this._initDisconnectHandler();
  }

  /**
   * @method _initConnectedHandler
   * @description handle user going offline / leaving application
   * 
   * Note.  Firestore doesn't handle this, so we have to use the firebase
   * database hack/workaround :(
   * https://firebase.google.com/docs/firestore/solutions/presence
   */
  async _initConnectedHandler() {
    // listen to updates about state of app
    this.firebase.database().ref('.info/connected').on('value', (snapshot) => {
      this.store.setConnectedState(snapshot.val());
      this._setPresenceRef();
    });

    // TODO:
    // we also need to listen to auth events and remove presence objects
    // automatically on logout
  }

  /**
   * @method setPresenceRef
   * @description update the presence reference for a user.  App must be connected
   * and user id must be set.  Should be called form this._initConnectedHandler and
   * model.setUserId
   */
  async setPresenceRef() {
    // if we have set a userId and are connected
    let uid = this.store.getUserId();
    if( !uid || !this.store.isConnected() ) return;

    // make sure we haven't already set a presence ref for this user
    if( this.currentUserPresenceId === uid ) return;
    this.currentUserPresenceId = uid;

    // if there was a presence reference for another user, remove it
    if( this.presenceRef ) {
      await this.presenceRef.set(null);
    }
    
    // create the new presence reference
    this.presenceRef = firebase.database()
      .ref('/presence/' + config.appId + '/' + userId + '/' + this.sessionClientId);
    
    // handle a disconnect event
    // Note: currently we are not doing anything with the disconnectRef
    this.onDisconnectRef = this.presenceRef.onDisconnect();
    this.onDisconnectRef.set(null);

    // set the current state to online
    return this.presenceRef.set({
      status: 'online',
      timestamp : Date.now() // to help debug in case of badness
    });
  }

  async updatePresence(presence) {
    presence.sessionId = this.sessionClientId;

    let promise = firestore
      .collection(this.collection)
      .doc(presence.id)
      .set(presence);

    this.store.setPresenceSaving(presence);
    
    try {
      await promise;
      this.store.setPresenceLoaded(presence);
    } catch(e) {
      this.store.setPresenceError(presence.id, e);
    }
  }

  async removePresence(id) {
    let promise = firestore
      .collection(this.collection)
      .doc(id)
      .delete();

    this.store.setPresenceDeleting(id);
    
    try {
      await promise;
      this.setPresenceDeleted(id)
    } catch(e) {
      this.store.setPresenceDeleteError(id, e);
    }
  }


}

module.exports = new PresenceService();