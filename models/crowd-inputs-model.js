const {BaseModel} = require('@ucd-lib/cork-app-utils');
const CrowdInputsService = require('../services/crowd-inputs-service');
const CrowdInputsStore = require('../stores/crowd-inputs-store');
const uuid = require('uuid');
const config = require('../config');

class CrowdInputsModel extends BaseModel {

  constructor() {

    this.service = CrowdInputsService;
    this.store = CrowdInputsStore;

    this.register('CrowdInputsModel');
  }

  /**
   * @method getApprovedByItem
   * @description get all approved crowd inputs by item
   * 
   * @param {String} id item id
   */
  getApprovedByItem(id) {
    let approved = this.store.getApprovedByItem(id) || {};

    try {
      if( approved.request ) {
        await approved.request;
      } else {
        await this.service.getApprovedByItem(id);
      }
    } catch(e) {}

    return this.store.getApprovedByItem(id);
  }

  /**
   * @method getApproved
   * @description get approved crowd inputs for a item
   * 
   * @param {String} id item id
   */
  getApproved(id) {
    let approved = this.store.getApproved(id) || {};

    try {
      if( approved.request ) {
        await approved.request;
      } else {
        await this.service.getApproved(id);
      }
    } catch(e) {}

    return this.store.getApproved(id);
  }

  /**
   * @method setApproved
   * @description Admin only. set crowd input as approved.  
   * Moves mark from Firestore to PGR
   * 
   * @param {String} id 
   */
  async setApproved(id) {
    let crowdInput = await this.getPending(id);
    if( crowdInput.state === this.store.STATE.ERROR ) {
      throw crowdInput.error;
    }

    // change id for pgr
    crowdInput.crowd_input_id = crowdInput.id;
    delete crowdInput.id;

    try {
      await this.service.setApproved(crowdInput);
    } catch(e) {}

    return this.store.getApproved(id);
  }

  /**
   * @method addPending
   * @description add a pending crowd input
   * 
   * @param {Object} crowdInput
   * @param {String} crowdInput.collectionId
   * @param {String} crowdInput.userId
   * @param {Boolean} crowdInput.anonymous
   * @param {String} crowdInput.appId
   * @param {String} crowdInput.itemId
   * @param {Object} crowdInput.data
   * 
   * @return {Promise}
   */
  addPending(crowdInput) {
    crowdInput.id = uuid.v4();
    
    if( !crowdInput.collectionId ) {
      throw new Error('Collection id required');
    }
    if( !crowdInput.userId && crowdInput.anonymous !== true ) {
      throw new Error('userId or anonymous flag required');
    }
    if( !crowdInput.appId ) {
      if( config.appId ) crowdInput.appId = config.appId;
      else throw new Error('appId required');
    }
    if( !crowdInput.itemId ) {
      throw new Error('itemId required');
    }
    if( !crowdInput.data ) {
      throw new Error('data required');
    }

    return this.service.addPending(crowdInput);
  }

  /**
   * @method getPending
   * @description get a pending crowd input by id.  by default, if item is already
   * loaded, no request is made.  The model here is that most pending crowd inputs
   * will be requested or realtime pushed by item id.  Use the noCache flag to
   * force a request
   * 
   * @param {String} id crowd input id
   * @param {Boolean} noCache defaults to false (use the cache).  To force http request, set to true
   * 
   * @return {Object} current state object
   */
  getPending(id, noCache=false) {
    let pendingInput = this.store.getPending(id) || {};

    if( pendingInput.request ) {
      await pendingInput.request;
    } else if( !noCache && pendingInput.state === this.store.STATE.LOADED ) {
      return pendingInput;
    } else {
      try {
        await this.service.getPending(id);
      } catch(e) {}
    }

    this.store.getPending(id);
  }

  /**
   * @method getPendingByItem
   * @description get pending crowd inputs for a item
   * 
   * @param {String} id item id
   */
  getPendingByItem(id) {
    let state = this.store.getPendingByItem(id) || {};
    
    if( state.request ) {
      await state.request;
    } else {
      await this.service.getPendingByItem(id);
    }

    return this.store.getPendingByItem(id);
  }

  /**
   * @method listenPending
   * @description get realtime updates for pending crowd inputs for a item
   * 
   * @param {String} id item id
   */
  listenPendingByItem(id) {
    this.service.listenPendingByItem(id);
  }

  /**
   * @method unlistenPending
   * @description stop listening for realtime updates for pending crowd inputs for a item
   * 
   * @param {String} id item id
   */
  unlistenPendingByItem(id) {
    let unsubscribe = this.store.getUnsubscribeByItemId(id);
    if( !unsubscribe ) return;
    unsubscribe();
    this.store.deleteUnsubscribeByItem(id);
  }

  // TODO persistence
}

module.exports = new CrowdInputsModel();