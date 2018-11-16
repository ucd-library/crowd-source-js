const {BaseStore} = require('@ucd-lib/cork-app-utils');

class CrowdInputsStore extends BaseStore {

  constructor() {
    super();

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
      CROWD_INPUT_DATA_UPDATE : 'crowd-input-data-update',
      ITEM_CROWD_INPUT_DATA_UPDATE : 'item-crowd-input-data-update'
    }
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
    this.emit(this.events.ITEM_CROWD_INPUT_DATA_UPDATE, newState);
  }

  // PENDING
  getPending(id) {
    return this.data.pending.byId[id];
  }

  setPendingSaving(data, promise) {
    this._setPendingState({
      id : data.id,
      payload : data,
      request : promise,
      state: this.STATE.SAVING
    });
  }

  setPendingSaveError(data, error) {
    this._setPendingState({
      id : data.id, 
      payload : data,
      error,
      state: this.STATE.SAVE_ERROR
    });
  }

  setPendingLoading(id, promise) {
    this._setPendingState({
      id,
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
    this._setPendingState({
      id, error,
      state: this.STATE.ERROR
    });
  }

  _setPendingState(newState) {
    let oldState = this.getPending(newState.id);
    if( !this.stateChanged(oldState, newState) ) {
      return;
    }
    this.data.pending.byId[newState.id] = newState;
    this.emit(this.events.CROWD_INPUT_DATA_UPDATE, newState);
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