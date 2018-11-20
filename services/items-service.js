const {BaseService} = require('@ucd-lib/cork-app-utils');
const ItemsStore = require('../stores/ItemsStore');
const config = require('../config');

class ItemsService extends BaseService {

  constructor() {
    super();
    this.store = ItemsStore;
  }

  /**
   * @method get
   * @description Get a item via elastic search
   * 
   * @param {string} id fin item id
   * @param {Boolean} noCache force http request for item
   * 
   * @returns {Promise}
   */
  get(id, noCache=false, transform) {
    if( !transform ) {
      transform = (item) => item;
    }

    return this.request({
      url : `${config.fin.host}/api/records${id}`,
      fetchOptions : {
        credentials : 'omit'
      },
      checkCached : () => (!noCache && this.store.get(id)),
      onLoading : request => this.store.setItemLoading(id, request),
      onError : e => this.store.setItemError(id, e),
      onLoad : response => this.store.setItemLoaded(id, transform(response.body))
    });
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
  search(id='', query = {}, nonce='') {
    var params = {
      facets : query.filters || {},
      filters : query.filters || {},
      offset : query.offset || 0,
      limit : query.limit || 12
    };

    if( query.text && query.textFields && query.textFields.length ) {
      params.text = query.text.trim();
      params.textFields = query.textFields
    }

    return this.request({
      url : `${config.fin.host}/api/records/search`,
      json : true,
      fetchOptions : {
        method : 'POST',
        credentials : 'omit',
        body : params
      },
      onLoading : request => this.store.setSearchLoading(id, request, params, nonce),
      onError : e => {
        if( this.store.getSearch().nonce !== nonce ) return;
        this.store.setSearchError(id, params, e, nonce)
      },
      onLoad : response => {
        if( this.store.getSearch().nonce !== nonce ) return;
        this.store.setSearchLoaded(id, params, response.body, nonce);
      }
    });
  }

  getCrowdInfo(id) {
    return this.request({
      url : `${config.pgr.host}/items?item_id=eq.${encodeURIComponent(id)}`,
      fetchOptions : {
        credentials : 'omit'
      },
      onLoading : request => this.store.setCrowdInfoLoading(id, request),
      onError : e => this.store.setCrowdInfoError(id, e),
      onLoad : response => this.store.setCrowdInfoLoaded(id, response.body)
    });
  }

  updateCrowdInfo(id, payload, jwt) {
    return this.request({
      url : `${API_HOST}/items`,
      qs : {item_id : `eq.${id}`},
      json : true,
      fetchOptions : {
        method : 'PATCH',
        body : payload,
        headers : {
          Prefer : 'return=representation',
          Authorization : `Bearer ${jwt}`
        }
      },
      onLoading : request => this.store.setCrowdInfoSaving(id, payload, request),
      onError : async e => this.store.setCrowdInfoSaveError(id, payload, e),
      onLoad : result => this.store.setCrowdInfoLoaded(id, result.body[0])
    });
  }

  getCrowdChildStats(id) {
    return this.request({
      url : `${config.pgr.host}/child_item_count`,
      fetchOptions : {
        method : 'POST',
        body : {item_id: id},
        credentials : 'omit'
      },
      onLoading : request => this.store.setCrowdChildStatsLoading(id, request),
      onError : e => this.store.setCrowdChildStatsError(id, e),
      onLoad : response => this.store.setCrowdChildStatsLoaded(id, response.body)
    });
  } 

}

module.exports = new ItemsService();