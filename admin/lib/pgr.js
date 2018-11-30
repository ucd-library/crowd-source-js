const request = require('./request');
const jwt = require('jsonwebtoken');
const config = require('../config');

class AdminPgr {

  constructor() {
    this.config = config.pgr;
  }

  createJwt(username, role) {
    return jwt.sign({username, role}, config.pgr.secret);
  }

  /**
   * @method createApp
   * @description create a PGR app
   * 
   * @param {Object} payload
   * @param {String} payload.app_id
   * @param {String} payload.name
   * @param {String} payload.description 
   * @param {String} jwt Optional.
   */
  createApp(payload, jwt) {
    if( !jwt ) jwt = config.pgr.jwt;
    return request(`${config.pgr.host}/applications`, {
      method : 'POST',
      body : JSON.stringify(payload),
      headers : {
        Prefer : 'return=representation',
        Authorization : `Bearer ${jwt}`
      }
    });
  }

  /**
   * @method listApps
   * @description list all applications in PGR
   * 
   * @returns {Promise}
   */
  listApps() {
    return request(`${config.pgr.host}/applications`);
  }

  /**
   * @method removeApp
   * @description remove application
   * 
   * @param {String} appId 
   * @param {String} jwt
   * 
   * @returns {Promise} 
   */
  removeApp(appId, jwt) {
    if( !jwt ) jwt = config.pgr.jwt;
    return request(`${config.pgr.host}/applications?app_id=eq.${appId}`, {
      method : 'DELETE',
      headers : {
        Authorization : `Bearer ${jwt}`
      }
    });
  }

  /**
   * @method createApp
   * @description create a PGR app
   * 
   * @param {Object} payload
   * @param {String} payload.collection_id
   * @param {String} payload.name
   * @param {String} payload.description 
   * @param {String} jwt Optional.
   */
  createCollection(payload, jwt) {
    if( !jwt ) jwt = config.pgr.jwt;
    return request(`${config.pgr.host}/collections`, {
      method : 'POST',
      body : JSON.stringify(payload),
      headers : {
        Prefer : 'return=representation',
        Authorization : `Bearer ${jwt}`
      }
    });
  }

  /**
   * @method listApps
   * @description list all applications in PGR
   * 
   * @returns {Promise}
   */
  listCollections() {
    return request(`${config.pgr.host}/collections`);
  }

  /**
   * @method removeCollection
   * @description remove collection
   * 
   * @param {String} collectionId 
   * @param {String} jwt
   * 
   * @returns {Promise} 
   */
  removeCollection(collectionId, jwt) {
    if( !jwt ) jwt = config.pgr.jwt;
    return request(`${config.pgr.host}/collections?collection_id=eq.${collectionId}`, {
      method : 'DELETE',
      headers : {
        Authorization : `Bearer ${jwt}`
      }
    });
  }
  
  /**
   * @method addAppSchema
   * @description register a JSON schema for application
   * 
   * @param {Object} payload
   * @param {String} payload.app_id 
   * @param {String} payload.schema_id ex: wine-mark
   * @param {String} payload.schema JSON Schema string 
   * @param {String} jwt Optional 
   * 
   * @returns {Promise}
   */
  addAppSchema(payload, jwt) {
    if( typeof payload.schema !== 'string' ) {
      payload.schema = JSON.stringify(payload.schema);
    }

    if( !jwt ) jwt = config.pgr.jwt;
    return request(`${config.pgr.host}/schemas`, {
      method : 'POST',
      body : JSON.stringify(payload),
      headers : {
        Prefer : 'return=representation',
        Authorization : `Bearer ${jwt}`
      }
    });
  }

  /**
   * @method listAppSchemas
   * @description list all application schemas for crowd_input.data
   * 
   * @param {String} appId
   * 
   * @return {Promise} 
   */
  listAppSchemas(appId) {
    return request(`${config.pgr.host}/schemas?app_id=eq.${appId}`);
  }



  /**
   * @method removeAppSchema
   * @description remove schema from application
   * 
   * @param {String} appId 
   * @param {String} schemaId 
   * @param {String} jwt
   * 
   * @returns {Promise} 
   */
  removeAppSchema(appId, schemaId, jwt) {
    if( !jwt ) jwt = config.pgr.jwt;

    return request(`${config.pgr.host}/schemas?app_id=eq.${appId}&schema_id=eq.${schemaId}`, {
      method : 'DELETE',
      headers : {
        Authorization : `Bearer ${jwt}`
      }
    });
  }

  /**
   * @method createAppItemId
   * @description create the item's table uid from appId and itemId
   * 
   * @param {String} appId 
   * @param {String} itemId 
   * 
   * @returns {String}
   */
  createAppItemId(appId, itemId) {
    return appId+':/'+itemId;
  }

  /**
   * @method addItem
   * @description add item
   * 
   * @param {Object} item
   * @param {String} item.app_id 
   * @param {String} item.collection_id 
   * @param {String} item.item_id 
   * @param {String} item.parent_item_id 
   * @param {Boolean} item.completed 
   * @param {Boolean} item.editable
   * @param {Boolean} item.index
   * @param {String} jwt Optional.
   * 
   * @returns {Promise}
   */
  addItem(item, options={}, jwt) {
    if( !item.app_id || !item.item_id ) {
      throw new Error('app_id and item_id required');
    }

    let payload = {
      app_item_id : this.createAppItemId(item.app_id, item.item_id),
      app_id : item.app_id,
      collection_id : item.collection_id,
      item_id : item.item_id,
      editable : options.editable !== undefined ? options.editable : true,
      completed : options.completed !== undefined ? options.completed : true,
      index : options.index !== undefined ? options.index : -1
    }
    if( item.parent_item_id ) {
      payload.parent_id = this.createAppItemId(item.app_id, item.parent_item_id);
    }
    if( !jwt ) jwt = config.pgr.jwt;

    return request(`${config.pgr.host}/items`, {
      method : 'POST',
      body : JSON.stringify(payload),
      headers : {
        Prefer : 'return=representation',
        Authorization : `Bearer ${jwt}`
      }
    });
  }

  listRootItems(appId) {
    return request(`${config.pgr.host}/items?app_id=eq.${appId}&parent_id=is.null`);
  }

  async listChildItems(appId, parentItemId) {
    let parentId = this.createAppItemId(appId, parentItemId);
    return request(`${config.pgr.host}/items?app_id=eq.${appId}&parent_id=eq.${encodeURIComponent(parentId)}`);
  }

  /**
   * @method updateItem
   * 
   * @param {Object} payload 
   * @param {String} jwt Optional.
   */
  updateItem(payload, jwt) {
    return request(`${config.pgr.host}/items/${item_id}`, {
      method : 'PATCH',
      body : JSON.stringify(payload),
      headers : {
        Prefer : 'return=representation',
        Authorization : `Bearer ${jwt}`
      }
    });
  }

  removeItem(appId, itemId, jwt) {
    if( !jwt ) jwt = config.pgr.jwt;

    return request(`${config.pgr.host}/items?app_id=eq.${appId}&item_id=eq.${itemId}`, {
      method : 'DELETE',
      headers : {
        Authorization : `Bearer ${jwt}`
      }
    });
  }

}

module.exports = new AdminPgr();