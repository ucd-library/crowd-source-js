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

  setAuthUserId(userId) {
    this.store.setUserId(userId);
    this.service.setPresenceRef();
  }

  /**
   * @method updatePresence
   * @description add or update presence data.  If a id is provided, an update will 
   * be performed, otherwise the id will be auto generated and a insert will be made.
   * The userId and sessionId properties will be automatically added to the object.
   * 
   * @param {Object} presence object to store
   * 
   * @returns {Promise} 
   */
  updatePresence(presence) {
    let uid = this.store.getUserId();
    if( !uid ) throw new Error('User id not set');

    presence.userId = uid;
    if( !presence.id ) {
      presence.id = uuid.v4();
    }
    presence.appId = config.appId;

    try {
      await this.service.updatePresence(presence);
    } catch(e) {}

    return this.store.getPresence(presence.id);
  }

  removePresence(id) {
    try {
      this.service.removePresence(id);
    } catch(e) {}

    return this.store.getPresence(id);
  }



}

module.exports = new PresenceModel();