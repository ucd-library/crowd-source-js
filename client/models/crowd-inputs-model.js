const {BaseModel} = require('@ucd-lib/cork-app-utils');
const CrowdInputsService = require('../services/crowd-inputs-service');
const CrowdInputsStore = require('../stores/crowd-inputs-store');
const AuthStore = require('../stores/auth-store');
const uuid = require('uuid');
const config = require('../config');
const clone = require('clone');

const FB_TO_PGR_MAP = {
  id : 'crowd_input_id',
  appId : 'app_id',
  collectionId : 'collection_id',
  itemId : 'item_id',
  schemaId : 'schema_id',
  userId : 'user_id'
}

class CrowdInputsModel extends BaseModel {

  constructor() {
    super();

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
  async getApprovedByItem(id) {
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
  async getApproved(id) {
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
   * @param {String} jwt Optional. pgr admin jwt. Defaults to AuthModel pgr token
   */
  async setApproved(id, jwt) {
    let crowdInput = await this.getPending(id);
    if( crowdInput.state === this.store.STATE.ERROR ) {
      throw crowdInput.error;
    }

    // change id for pgr
    crowdInput = clone(crowdInput.payload);
    crowdInput.data = JSON.stringify(crowdInput.data);
    for( let key in FB_TO_PGR_MAP ) {
      crowdInput[FB_TO_PGR_MAP[key]] = crowdInput[key];
      delete crowdInput[key];
    }
    
    if( !jwt ) {
      jwt = AuthStore.getPgrToken();
    }
    
    try {
      await this.service.setApproved(crowdInput, jwt);
    } catch(e) {
      console.log('here', e);
    }

    return this.store.getApproved(id);
  }

  /**
   * @method removePending
   * @description remove a pending crowd input.  can be called by admin or owner of input
   * 
   * @param {String} id crowd input id
   *
   * @returns {Promise} 
   */
  async removePending(id, jwt) {
    if( !jwt ) {
      jwt = AuthStore.getFirebaseToken();
    }

    try {
      await this.service.removePending(id, jwt);
    } catch(e) {}

    return this.store.getPending(id);
  }

  /**
   * @method updatePending
   * @description update a pending crowd input.  You must set the userId
   * parameter or the user must be an admin!
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
  async updatePending(crowdInput, jwt) {
    if( !crowdInput.id ) {
      throw new Error('Crowd input id required');
    }

    // sending votes on update will fail here.  make sure they are stripped.
    // Use votes API to edit votes
    if( crowdInput.votes ) {
      crowdInput = clone(crowdInput);
      delete crowdInput.votes;
    }

    if( !jwt ) {
      jwt = AuthStore.getFirebaseToken();
    }

    try {
      await this.service.updatePending(crowdInput, false, jwt);
    } catch(e) {}

    return this.store.getPending(crowdInput.id);
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
  async addPending(crowdInput, jwt) {
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

    if( !jwt ) {
      jwt = AuthStore.getFirebaseToken();
    }

    try {
      await this.service.updatePending(crowdInput, true, jwt);
    } catch(e) {}

    return this.store.getPending(crowdInput.id);
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
  async getPending(id, noCache=false) {
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

    return this.store.getPending(id);
  }

  async votePending(id, vote, jwt) {
    if( !jwt ) jwt = AuthStore.getFirebaseToken();
    if( typeof vote !== 'object' ) {
      vote = {value: vote};
    }

    await this.service.votePending(id, vote, jwt);
    return this.getPending(id, true);
  }

  async removeVotePending(id, jwt) {
    if( !jwt ) jwt = AuthStore.getFirebaseToken();
    await this.service.removeVotePending(id, jwt);
    return this.getPending(id, true);
  }

  /**
   * @method getPendingByItem
   * @description get pending crowd inputs for a item
   * 
   * @param {String} id item id
   */
  async getPendingByItem(id) {
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
        this.unlistenPendingByItem(itemId);
      });
  }
}

module.exports = new CrowdInputsModel();