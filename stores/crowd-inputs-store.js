const {BaseStore} = require('@ucd-lib/cork-app-utils');

class CrowdInputsStore extends BaseStore {

  constructor() {
    super();

    this.CUSTOM_STATES = {
      APPROVING : 'approving',
      APPROVED : 'approved'
    }

    this.data = {
      pending : {
        byItem : {},
        byId : {},
        // firestore item listeners
        unsubscribeByItem : {}
      },
      approved : {
        byItem : {},
        byId : {}
      }
    }

    this.events = {
      PENDING_CROWD_INPUT_DATA_UPDATE : 'pending-crowd-input-data-update',
      PENDING_ITEM_CROWD_INPUT_DATA_UPDATE : 'pending-item-crowd-input-data-update',
      APPROVED_CROWD_INPUT_DATA_UPDATE : 'approved-crowd-input-data-update',
      APPROVED_ITEM_CROWD_INPUT_DATA_UPDATE : 'approved-item-crowd-input-data-update'
    }
  }

  // APPROVED
  getApproved(id) {
    return this.data.approved.byId[id]  
  }

  setApprovedLoading(id, promise) {
    this._setApprovedState({
      id,
      request : promise,
      state: this.STATE.LOADING
    });
  }

  setApprovedLoaded(id, payload) {
    this._setApprovedState({
      id, payload,
      state: this.STATE.LOADED
    });
  }

  setApprovedError(id, error) {
    this._setApprovedState({
      id, error,
      state: this.STATE.ERROR
    });
  }

  _setApprovedState(newState) {
    let oldState = this.getPendingByItem(newState.id);
    if( !this.stateChanged(oldState, newState) ) {
      return;
    }
    this.data.approved.byId[newState.id] = newState;
    this.emit(this.events.APPROVED_CROWD_INPUT_DATA_UPDATE, newState);
  }

  // APPROVED BY ITEM
  getApprovedByItem(id) {
    return this.data.approved.byItem[id];  
  }

  setApprovedByItemLoading(id, promise) {
    this._setApprovedByItemState({
      id,
      request : promise,
      state: this.STATE.LOADING
    });
  }

  setApprovedByItemLoaded(id, payload) {
    this._setApprovedByItemState({
      id, payload,
      state: this.STATE.LOADED
    });
  }

  setApprovedByItemError(id, error) {
    this._setApprovedByItemState({
      id, error,
      state: this.STATE.ERROR
    });
  }

  mergeApprovedIntoItem(id, docs) {
    // merge with current state of marks
    let currentDocs = this.getApprovedByItem(id) || {};
    if( currentDocs.state === 'loaded' )  {
      currentDocs = currentDocs.payload;
    }
    docs = Object.assign({}, currentDocs, docs);

    this.setApprovedByItemLoaded(id, docs);
  }

  _setApprovedByItemState(newState) {
    let oldState = this.getPendingByItem(newState.id);
    if( !this.stateChanged(oldState, newState) ) {
      return;
    }
    this.data.approved.byId[newState.id] = newState;
    this.emit(this.events.APPROVED_ITEM_CROWD_INPUT_DATA_UPDATE, newState);
  }

  // PENDING BY ITEM
  getPendingByItem(id) {
    return this.data.pending.byItem[id];
  }

  setPendingByItemLoading(id, promise) {
    this._setPendingByItemState({
      id,
      request : promise,
      state: this.STATE.LOADING
    });
  }

  setPendingByItemLoaded(id, payload) {
    this._setPendingByItemState({
      id, payload,
      state: this.STATE.LOADED
    });

    for( let key in payload ) {
      this._setPendingState({
        id: key, deleted: false,
        payload : payload[key],
        state : this.STATE.LOADED
      });
    }
  }

  setPendingByItemError(id, error) {
    this._setPendingByItemState({
      id, error,
      state: this.STATE.ERROR
    });
  }

  mergePendingIntoItem(id, docs) {
    // merge with current state of marks
    let currentDocs = this.getPendingByItem(id) || {};
    if( currentDocs.state === 'loaded' )  {
      currentDocs = currentDocs.payload;
    }
    docs = Object.assign({}, currentDocs, docs);

    this.setPendingByItemLoaded(id, docs);
  }

  _setPendingByItemState(newState) {
    let oldState = this.getPendingByItem(newState.id);
    if( !this.stateChanged(oldState, newState) ) {
      return;
    }
    this.data.pending.byItem[newState.id] = newState;
    this.emit(this.events.PENDING_ITEM_CROWD_INPUT_DATA_UPDATE, newState);
  }

  // PENDING
  getPending(id) {
    return this.data.pending.byId[id];
  }

  setPendingApproving(data, promise) {
    // keep track of current payload if we have it
    let currentState = this.getPending(data.id) || {};

    this._setPendingState({
      id : data.id,
      payload : currentState.payload,
      approvePayload : data,
      request : promise,
      state: this.CUSTOM_STATES.APPROVING
    });
  }

  setPendingApproved(data, body) {
    // keep track of current payload if we have it
    let currentState = this.getPending(data.id) || {};

    this._setPendingState({
      id : data.id,
      payload : currentState.payload,
      approvePayload : data,
      body,
      state: this.CUSTOM_STATES.APPROVED
    });
  }

  setPendingDeleting(id, promise) {
    // keep track of current payload if we have it
    let currentState = this.getPending(id) || {};

    this._setPendingState({
      id,
      payload : currentState.payload,
      request : promise,
      state: this.STATE.DELETING
    });
  }

  setPendingDeleted(id) {
    // keep track of current payload if we have it
    let currentState = this.getPending(id) || {};

    this._setPendingState({
      id,
      deleted : true,
      payload : currentState.payload,
      state: this.STATE.LOADED
    });
  }

  setPendingDeleteError(id, error) {
    // keep track of current payload if we have it
    let currentState = this.getPending(id) || {};

    this._setPendingState({
      id, error,
      payload : currentState.payload,
      state: this.STATE.DELETE_ERROR
    });
  }

  setPendingSaving(data, promise) {
    // keep track of current payload if we have it
    let currentState = this.getPending(data.id) || {};

    this._setPendingState({
      id : data.id,
      payload : currentState.payload,
      savePayload : data,
      request : promise,
      state: this.STATE.SAVING
    });
  }

  setPendingSaveError(data, error) {
    // keep track of current payload if we have it
    let currentState = this.getPending(data.id) || {};

    this._setPendingState({
      id : data.id, 
      payload : currentState.payload,
      savePayload : data,
      error,
      state: this.STATE.SAVE_ERROR
    });
  }

  setPendingLoading(id, promise) {
    // keep track of current payload if we have it
    let currentState = this.getPending(id) || {};

    this._setPendingState({
      id,
      payload : currentState.payload,
      request : promise,
      state: this.STATE.LOADING
    });
  }

  setPendingLoaded(id, payload, deleted=false) {
    this._setPendingState({
      id, payload, deleted,
      state: this.STATE.LOADED
    });
  }

  setPendingError(id, error) {
    // keep track of current payload if we have it
    let currentState = this.getPending(id) || {};

    this._setPendingState({
      id, error,
      payload : currentState.payload,
      state: this.STATE.ERROR
    });
  }

  _setPendingState(newState) {
    let oldState = this.getPending(newState.id);
    if( !this.stateChanged(oldState, newState) ) {
      return;
    }
    this.data.pending.byId[newState.id] = newState;
    this.emit(this.events.PENDING_CROWD_INPUT_DATA_UPDATE, newState);
  }

  // unsubscribe
  getUnsubscribeByItemId(id) {
    return this.data.pending.unsubscribeByItem[id];
  }

  setUnsubscribeByItem(id, unsubscribe) {
    this.data.pending.unsubscribeByItem[id] = unsubscribe;
  }

  deleteUnsubscribeByItem(id) {
    if( this.data.pending.unsubscribeByItem[id] ) {
      delete this.data.pending.unsubscribeByItem[id];
    }
  }

}

module.exports = new CrowdInputsStore();