const {BaseStore} = require('@ucd-lib/cork-app-utils');

class PresenceStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      connected : false,
      userId :  null,
      userPresence : {},
      itemPresence : {}
    }

    this.events = {
      USER_PRESENCE_UPDATE : 'user-presence-update',
      CONNECTION_STATUS_UPDATE : 'connection-status-update',
      PRESENCE_UPDATE : 'presence-update',
      ITEM_PRESENCE_UPDATE : 'item-presence-update'
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

  getUserPresence(id) {
    return this.data.userPresence[id];
  }

  setUserPresenceSaving(presence) {
    let currentState = this.getPresence(presence.id) || {};

    this._setPresenceState({
      id : presence.id,
      payload: currentState.payload,
      savePayload : presence,
      state : this.STATE.SAVING
    });
  }

  setUserPresenceDeleting(id) {
    let currentState = this.getPresence(id) || {};

    this._setPresenceState({
      id : id,
      payload: currentState.payload,
      savePayload : presence,
      state : this.STATE.DELETING
    });
  }

  setUserPresenceError(id, error) {
    let currentState = this.getPresence(id) || {};

    this._setPresenceState({
      id : presence.id,
      payload: currentState.payload,
      savePayload: currentState.savePayload,
      error,
      state : this.STATE.SAVE_ERROR
    });
  }

  setUserPresenceDeleteError(id, error) {
    let currentState = this.getPresence(id) || {};

    this._setPresenceState({
      id : id,
      payload: currentState.payload,
      savePayload: currentState.savePayload,
      error,
      state : this.STATE.DELETE_ERROR
    });
  }

  setUserPresenceDeleted(id) {
    let currentState = this.getPresence(id);
    if( !currentState ) return;

    delete this.data.userPresence[id];

    this.emit(this.PRESENCE_UPDATE, {
      id : currentState.id,
      payload : currentState.payload,
      state : this.STATE.DELETED
    });
  }

  setUserPresenceLoaded(presence) {
    this._setPresenceState({
      id : presence.id,
      payload: presence,
      state : this.STATE.LOADED
    });
  }

  _setUserPresenceState(newState) {
    let currentState = this.getPresence(newState.id);
    if( !this.stateChanged(currentState, newState) ) {
      return;
    }
    this.data.userPresence[newState.id] = newState;
    this.emit(this.PRESENCE_UPDATE, newState);
  }

  setPresenceByItemUpdate(itemId, data, removed) {
    let item = this.data.itemPresence[itemId];
    if( !item ) {
      item = {
        id : itemId,
        payload : {},
        state : this.STATE.LOADED
      }
    }

    if( removed ) {
      if( item.payload[data.id] ) {
        delete item.payload[data.id];
      }
    } else {
      item.payload[data.id] = data;
    }

    this.data.itemPresence[itemId] = item;
    this.emit(this.events.ITEM_PRESENCE_UPDATE, item);
  }

  deletePresenceByItem() {
    if( this.data.itemPresence[id] ) {
      delete this.data.itemPresence[id];
    }
  }

  getAllListeningIds() {
    return Object.keys(this.data.itemPresence);
  }

  getUnsubscribeByItemId(id) {
    if( this.data.itemPresence[id] ) {
      return this.data.itemPresence[id].unsubsribe;
    }
  }

  setUnsubscribeByItem(id, unsubscribe) {
    let item = this.data.itemPresence[itemId];
    if( !item ) {
      item = {id}
    }
    item.unsubscribe = unsubscribe;
    this.data.itemPresence[id] = item;
  }

}

module.exports = new PresenceStore();