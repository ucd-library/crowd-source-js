const {BaseModel} = require('@ucd-lib/cork-app-utils');
const ItemsService = require('../services/items-service');
const AuthStore = require('../stores/auth-store');

class ItemsModel extends BaseModel {

  constructor() {
    super();

    this.service = ItemsService;

    this.register('ItemsModel');
  }

  /**
   * @method get
   * @description Get a specific item by id
   * 
   * @param {String} id fin item id 
   * @param {Boolean} noCache force http request for item
   * 
   * @returns {Object} current item state
   */
  async get(id, noCache=false) {
    let item = this.store.get(id) || {};

    // if there is already a request pending, just wait on it
    if( item.request ) {
      await item.request;
    } else {
      await this.service.get(id, noCache);
    }

    return this.store.get(id);
  }

  /**
   * @method search
   * @description Search the fin items.
   * 
   * @param {String} id identifier for search, so you can have multiple searchs going (eg catalogs and pages)
   * @param {Object} query query parameters
   * @param {String} query.text text search value
   * @param {String} query.facets search facet filters to return
   * @param {String} query.filters search facet filters
   * @param {Boolean} query.allItems search all items, not just root items (TODO)
   * @param {Number} query.offset result offset 
   * @param {Number} query.limit result limit
   * @param {Array} query.textFields text fields to use in text search
   * @param {String} nonce id used for specific query (good for typeahead search)
   * 
   * @returns {Object} current search result state
   */
  async search(id, query, nonce) {
    try {
      await this.service.search(id, query, nonce);
    } catch(e) {}

    return this.store.getSearch(id);
  }

  /**
   * @method getCrowdInfo
   * @description get crowd info about item.  This is not the crowd inputs (crowd data)
   * rather direct information about the item such as editable, complete, etc.
   * 
   * @param {String} id item id
   */
  async getCrowdInfo(id) {
    let stats = this.store.getCrowdInfo(id) || {};

    if( stats.request ) {
      await stats.request;
    } else {
      await this.service.getCrowdInfo(id);
    }

    return this.store.getCrowdInfo(id);
  }

  /**
   * @method updateCrowdInfo
   * @description update crowd source metadata for item
   * 
   * @param {String} id item id
   * @param {Object} flags update flags
   * @param {Boolean} flags.editable should the crowd make edits to item
   * @param {Boolean} flags.completed is the item complete, no more crowd inputs should be made
   * @param {Boolean} jwt Optional.  Defaults to PGR jwt token stored in AuthStore
   * 
   * @returns {Promise}
   */
  async updateCrowdInfo(id, flags, jwt) {
    let payload = {};
    if( flags.completed !== undefined ) {
      payload.completed = flags.completed;
    }
    if( flags.editable !== undefined ) {
      payload.editable = flags.editable;
    }
    if( Object.keys(payload).length === 0 ) {
      return; // noop
    }
    
    try {
      if( !jwt ) {
        jwt = AuthStore.getTokens().pgr;
      }
      await this.service.updateCrowdInfo(id, payload, tokens.pgr);
    } catch(e) {}

    return this.store.getCrowdInfo(id);
  }

  /**
   * @method getCrowdChildStats
   * @description get summary of items children.  This summary include editable, complete, etc.
   * 
   * @param {String} id item id
   */
  async getCrowdChildStats(id) {
    let stats = this.store.getCrowdChildStats(id) || {};

    if( stats.request ) {
      await stats.request;
    } else {
      await this.service.getCrowdChildStats(id);
    }

    return this.store.getCrowdChildStats(id);
  }

}

module.exports = new ItemsModel();