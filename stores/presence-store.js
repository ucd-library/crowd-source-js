const {BaseStore} = require('@ucd-lib/cork-app-utils');

class PresenceStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      connected : false,
      userId :  null,
      presence : {}
    }

    this.events = {
      USER_PRESENCE_UPDATE : 'user-presence-update',
      CONNECTION_STATUS_UPDATE : 'connection-status-update',
      PRESENCE_UPDATE : 'presence-update'
    }
  }

  isConnected() {
    return this.data.connected;
  }

  getUserId() {
    return this.data.userId;
  }

  setUserId(userId) {
    if( this.data.userId === userId ) return;
    this.emit(this.events.USER_PRESENCE_UPDATE, userId);
  }

  setConnectedState(connected) {
    if( this.data.connected === connected ) return;
    this.emit(this.events.CONNECTION_STATUS_UPDATE, connected);
  }

  getPresence(id) {
    return this.data.presence[id];
  }

  setPresenceSaving(presence) {
    let currentState = this.getPresence(presence.id) || {};

    this._setPresenceState({
      id : presence.id,
      payload: currentState.payload,
      savePayload : presence,
      state : this.STATE.SAVING
    });
  }

  setPresenceDeleting(id) {
    let currentState = this.getPresence(id) || {};

    this._setPresenceState({
      id : id,
      payload: currentState.payload,
      savePayload : presence,
      state : this.STATE.DELETING
    });
  }

  setPresenceError(id, error) {
    let currentState = this.getPresence(id) || {};

    this._setPresenceState({
      id : presence.id,
      payload: currentState.payload,
      savePayload: currentState.savePayload,
      error,
      state : this.STATE.SAVE_ERROR
    });
  }

  setPresenceDeleteError(id, error) {
    let currentState = this.getPresence(id) || {};

    this._setPresenceState({
      id : id,
      payload: currentState.payload,
      savePayload: currentState.savePayload,
      error,
      state : this.STATE.DELETE_ERROR
    });
  }

  setPresenceDeleted(id) {
    let currentState = this.getPresence(id);
    if( !currentState ) return;

    delete this.data.presence[id];

    this.emit(this.PRESENCE_UPDATE, {
      id : currentState.id,
      payload : currentState.payload,
      state : this.STATE.DELETED
    });
  }

  setPresenceLoaded(presence) {
    this._setPresenceState({
      id : presence.id,
      payload: presence,
      state : this.STATE.LOADED
    });
  }

  _setPresenceState(newState) {
    let currentState = this.getPresence(newState.id);
    if( !this.stateChanged(currentState, newState) ) {
      return;
    }
    this.data.presence[newState.id] = newState;
    this.emit(this.PRESENCE_UPDATE, newState);
  }

}

module.exports = new PresenceStore();