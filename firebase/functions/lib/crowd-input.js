const admin = require('../lib/firebase-admin');
const Validator = require('jsonschema').Validator;
const crowdInputSchema = require('./crowd-input-schema');
const config = require('../config');

class CrowdInput {

  constructor() {
    this.validator = new Validator();
  }

  /**
   * @method _getSchema
   * @description get json schema by appId and schemaId
   * 
   * @param {String} appId 
   * @param {String} schemaId
   * 
   * @returns {Promise} resolves to null or schema object 
   */
  _getSchema(appId, schemaId) {
    let querySnapshot = await admin.firestore().collection(config.collections.schemas)
      .where('appId', '==', appId)
      .where('schemaId', '==', schemaId)
      .get();
    
    if( querySnapshot.docs.length === 0 ) return null;
    return JSON.parse(querySnapshot.docs[0].data().schema);
  }

  async verifyCrowdInputSchema(crowdInput) {
    this.validator.validate(crowdInput, crowdInputSchema, {throwError: true});

    let schema = await this._getSchema(crowdInput.appId, crowdInput.schemaId);
    if( !schema ) throw new Error(`Unknown app or schema id: ${crowdInput.appId}/${crowdInput.schemaId}`);

    if( typeof crowdInput.data === 'string' ) {
      crowdInput.data = JSON.parse(crowdInput.data);
    }

    this.validator.validate(crowdInput.data, schema, {throwError: true});
  }

  get(id) {
    let snapshot = await admin.firestore().collection(config.collections.crowdInputs)
      .doc(id)
      .get();

    if( !snapshot.exists ) return null;
    return snapshot.data();
  }

  async update(data) {
    await this.verifyCrowdInputSchema(data);
    
    return admin.firestore().collection(config.collections.crowdInputs)
      .doc(data.id)
      .set(data)
  }

  async delete(id) {
    return admin.firestore().collection(config.collections.crowdInputs)
      .doc(id)
      .delete()
  }

}

module.exports = new CrowdInput();