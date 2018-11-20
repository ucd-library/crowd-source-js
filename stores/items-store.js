const {BaseStore} = require('@ucd-lib/cork-app-utils');

class ItemsStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      search : {},
      byId : {},
      crowdInfo : {},
      childStats : {}
    }

    this.events = {
      ITEM_UPDATE : 'item-update',
      ITEM_SEARCH_UDPATE : 'item-search-update',
      ITEM_CROWD_INFO_UPDATE : 'item-crowd-info-update',
      ITEM_CROWD_CHILD_STATS_UPDATE : 'item-crowd-child-stats-update'
    }
  }

  // GET ITEM
  get(id) {
    return this.data.byId[id];
  }

  setCatalogLoading(id, promise) {
    this._setItemState({
      id, 
      request : promise,
      state: this.STATE.LOADING
    });
  }

  setCatalogLoaded(id, catalog) {
    this._setItemState({
      id, 
      payload: catalog, 
      state: this.STATE.LOADED
    });
  }

  setCatalogError(id, error) {
    this._setItemState({
      id, error, 
      state: this.STATE.ERROR
    });
  }

  _setItemState(newState) {
    if( !this.stateChanged(this.get(newState.id), newState) ) {
      return;
    }
    this.data.byId[newState.id] = newState;
    this.emit(this.events.ITEM_UPDATE, newState);
  }

  // SEARCH ITEM
  getSearch(id) {
    return this.data.search[id];
  }

  setSearchLoading(id, promise, params, nonce) {
    this._setSearchState({
      id, nonce, params,
      request : promise,
      state: this.STATE.LOADING
    });
  }

  setSearchLoaded(id, params, payload, nonce) {
    this._setSearchState({
      id, params, payload, nonce,
      state: this.STATE.LOADED
    });
  }

  setSearchError(id, params, error, nonce) {
    this._setSearchState({
      id, params, error, nonce,
      state: this.STATE.ERROR
    });
  }

  _setSearchState(newState) {
    if( !this.stateChanged(this.getSearch(newState.id), newState) ) {
      return;
    }
    this.data.search[newState.id] = newState;
    this.emit(this.events.ITEM_SEARCH_UDPATE, newState);
  }

  // ITEM CROWD INFO
  getCrowdInfo(id) {
    return this.data.crowdInfo[id];
  }

  setCrowdInfoLoading(id, promise) {
    this._setCrowdInfoState({
      id,
      request : promise,
      state: this.STATE.LOADING
    });
  }

  setCrowdInfoLoaded(id, payload) {
    this._setCrowdInfoState({
      id, payload,
      state: this.STATE.LOADED
    });
  }

  setCrowdInfoSaving(id, payload, request) {
    let currentState = this.getCrowdInfo(id) || {};

    this._setCrowdInfoState({
      id, request,
      payload : currentState.payload,
      savePayload : payload,
      state: this.STATE.SAVING
    });
  }

  setCrowdInfoSaveError(id, payload, error) {
    let currentState = this.getCrowdInfo(id) || {};

    this._setCrowdInfoState({
      id, error,
      payload : currentState.payload,
      savePayload : payload,
      state: this.STATE.SAVE_ERROR
    });
  }

  setCrowdInfoError(id, error) {
    this._setCrowdInfoState({
      id, error,
      state: this.STATE.ERROR
    });
  }

  _setCrowdInfoState(newState) {
    if( !this.stateChanged(this.getCrowdInfo(newState.id), newState) ) {
      return;
    }
    this.data.crowdInfo[newState.id] = newState;
    this.emit(this.events.ITEM_CROWD_INFO_UPDATE, newState);
  }

  // ITEM CROWD CHILD STATS
  getCrowdChildStats(id) {
    return this.data.childStats[id];
  }

  setCrowdChildStatsLoading(id, promise) {
    this._setCrowdChildStatsState({
      id,
      request : promise,
      state: this.STATE.LOADING
    });
  }

  setCrowdChildStatsLoaded(id, payload) {
    this._setCrowdChildStatsState({
      id, payload,
      state: this.STATE.LOADED
    });
  }

  setCrowdChildStatsError(id, error) {
    this._setCrowdInfoState({
      id, error,
      state: this.STATE.ERROR
    });
  }

  _setCrowdChildStatsState(newState) {
    if( !this.stateChanged(this.getCrowdChildStats(newState.id), newState) ) {
      return;
    }
    this.data.childStats[newState.id] = newState;
    this.emit(this.events.ITEM_CROWD_CHILD_STATS_UPDATE, newState);
  }

}

module.exports = new ItemsStore();