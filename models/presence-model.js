const {BaseModel} = require('@ucd-lib/cork-app-utils');
const PresenceService = require('../services/presence-service');
const PresenceStore = require('../stores/presence-store');
const uuid = require('uuid');
const config = require('../config');

class PresenceModel extends BaseModel {

  constructor() {
    super();

    this.service = PresenceService;
    this.store = PresenceStore;

    this.register('PresenceModel');
  }

  /**
   * @method updateUserPresence
   * @description add or update presence data.  If a id is provided, an update will 
   * be performed, otherwise the id will be auto generated and a insert will be made.
   * The userId and sessionId properties will be automatically added to the object.
   * 
   * @param {Object} presence object to store
   * 
   * @returns {Promise} 
   */
  updateUserPresence(presence) {
    let uid = this.store.getUserId();
    if( !uid ) throw new Error('User id not set');

    presence.userId = uid;
    if( !presence.id ) {
      presence.id = uuid.v4();
    }
    presence.appId = config.appId;

    try {
      await this.service.updateUserPresence(presence);
    } catch(e) {}

    return this.store.getUserPresence(presence.id);
  }

  removeUserPresence(id) {
    try {
      this.service.removeUserPresence(id);
    } catch(e) {}

    return this.store.getUserPresence(id);
  }

  /**
   * @method listenPending
   * @description get realtime updates for user presence by item
   * 
   * @param {String} id item id
   */
  listenPresenceByItem(id) {
    this.service.listenPresenceByItem(id);
  }

  /**
   * @method unlistenPending
   * @description stop listening for realtime updates for presence
   * 
   * @param {String} id item id
   */
  unlistenPresenceByItem(id) {
    let unsubscribe = this.store.getUnsubscribeByItemId(id);
    if( !unsubscribe ) return;
    unsubscribe();
    this.store.deletePresenceByItem(id);
  }

  /**
   * @method cleanupRtc
   * @description After firestore keepalive request, this will be called.  It will let you know
   * all the ItemId crowd input that elements are still interested in.  You are free to 
   * remove any Firebase Reference that is NOT in this list.
   * 
   * @param {Object} interested - hash of keepalive item ids
   */
  cleanupRtc(interested) {
    this.store
      .getAllListeningIds()
      .forEach(itemId => {
        if( interested[itemId] ) return;
        this.unlistenPresenceByItem(itemId);
      });
  }


}

module.exports = new PresenceModel();