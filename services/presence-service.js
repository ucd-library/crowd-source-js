const {BaseService, EventBus} = require('@ucd-lib/cork-app-utils');
const PresenceStore = require('../stores/presence-store');
const firestore = require('../lib/firestore');
const AuthStore = require('../stores/auth-store');
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
   * @description handle user losing/gaining connection to firebase
   * 
   * Note.  Firestore doesn't handle this, so we have to use the firebase
   * database hack/workaround :(
   * https://firebase.google.com/docs/firestore/solutions/presence
   */
  _initConnectedHandler() {
    // listen to updates about state of app
    this.firebase.database().ref('.info/connected').on('value', (snapshot) => {
      this.store.setConnectedState(snapshot.val());
      this.setUserPresenceRef();

      // make sure all presence objects exist
      // they were removed by firebase cloud function trigger on disconnect
      if( this.store.isConnected() ) {
        for( let id in this.data.userPresence ) {
          this.updateUserPresence(this.data.userPresence[id]);
        }
      }
    });
  }

  /**
   * @method _initAuthHandler
   * @description handle user logging in/out
   */
  _initAuthHandler() {
    EventBus.on(AuthStore.events.AUTH_USER_UPDATE, e => {
      if( !e.user ) this.store.setUserId(null);
      else this.store.setUserId(e.user.uid);
      this.setUserPresenceRef();
    });
  }

  /**
   * @method setPresenceRef
   * @description update the presence reference for a user.  App must be connected
   * and user id must be set.  Should be called form this._initConnectedHandler and
   * model.setUserId
   */
  async setUserPresenceRef() {
    // if we have set a userId and are connected
    let uid = this.store.getUserId();
    if( !uid || !this.store.isConnected() ) {
      // remove any existing presence
      if( this.presenceRef ) {
        await this.presenceRef.set(null);
        this.currentUserPresenceId = null;
      }
      return;
    }

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

  async updateUserPresence(presence) {
    presence.sessionId = this.sessionClientId;

    let promise = firestore
      .collection(this.collection)
      .doc(presence.id)
      .set(presence);

    this.store.setUserPresenceSaving(presence);
    
    try {
      await promise;
      this.store.setUserPresenceLoaded(presence);
    } catch(e) {
      this.store.setUserPresenceError(presence.id, e);
    }
  }

  async removeUserPresence(id) {
    let promise = firestore
      .collection(this.collection)
      .doc(id)
      .delete();

    this.store.setUserPresenceDeleting(id);
    
    try {
      await promise;
      this.setUserPresenceDeleted(id)
    } catch(e) {
      this.store.setUserPresenceDeleteError(id, e);
    }
  }

  async listenPresenceByItem(id) {
    // check if we are already listening
    let unsubscribe = this.store.getUnsubscribeByItemId(id);
    if( unsubscribe ) return;

    let unsubscribe = firestore.db.
      collection(this.collection)
      .where('item_id', '==', id)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          let removed = (change.type === 'removed') ? true : false;
          let data = change.doc.data();

          // set the new state for the pending input right now
          this.store.setPresenceByItemUpdate(id, data, removed);
        });
      });
    
    this.store.setUnsubscribeByItem(id, unsubscribe);
  }

}

module.exports = new PresenceService();