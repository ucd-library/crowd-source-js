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
   * @method addAppSchema
   * @description register a JSON schema for application
   * 
   * @param {String} appId 
   * @param {String} schemaId ex: wine-mark
   * @param {String} schema JSON Schema string 
   * @param {String} jwt Optional 
   * 
   * @returns {Promise}
   */
  addAppSchema(appId, schemaId, schema, jwt) {
    if( !jwt ) jwt = config.pgr.jwt;
    return request(`${config.pgr.host}/schemas`, {
      method : 'POST',
      body : JSON.stringify({
        app_id : appId,
        schema_id : schemaId,
        schema
      }),
      headers : {
        Prefer : 'return=representation',
        Authorization : `Bearer ${jwt}`
      }
    });
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
   * @param {String} appId 
   * @param {String} collectionId 
   * @param {String} itemId 
   * @param {String} parentItemId item_id of parent item.  will append app_id for you and set as parent_id.
   * @param {Object} options 
   * @param {Boolean} options.completed 
   * @param {Boolean} options.editable
   * @param {Boolean} options.index
   * @param {String} jwt Optional.
   * 
   * @returns {Promise}
   */
  addItem(appId, collectionId, itemId, parentItemId, options={}, jwt) {
    let payload = {
      app_item_id : this.createAppItemId(appId, itemId),
      app_id : appId,
      collection_id : collectionId,
      item_id : itemId,
      editable : options.editable !== undefined ? options.editable : true,
      completed : options.completed !== undefined ? options.completed : true,
      index : options.index !== undefined ? options.index : -1
    }
    if( parentItemId ) {
      payload.parent_id = this.createAppItemId(appId, parentItemId);
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

  /**
   * @method updateItem
   * 
   * @param {Object} payload 
   * @param {String} jwt Optional.
   */
  updateItem(payload, jwt) {
    return request(`${config.pgr.host}/items`, {
      method : 'PATCH',
      body : JSON.stringify(payload),
      headers : {
        Prefer : 'return=representation',
        Authorization : `Bearer ${jwt}`
      }
    });
  }


}

module.exports = new AdminPgr();