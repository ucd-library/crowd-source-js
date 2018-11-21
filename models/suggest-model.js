const {BaseModel} = require('@ucd-lib/cork-app-utils');
const SuggestService = require('../lib/services/SuggestService');
const SuggestStore = require('../stores/suggest-store');
const AuthStore = require('../stores/auth-store');
const config = require('../config');

class SuggestModel extends BaseModel {

  constructor() {
    super();

    this.store = SuggestStore;
    this.service = SuggestService;
      
    this.register('SuggestModel');
  }

  addSuggestion(type, text, options={}) {
    let jwt = options.jwt || AuthStore.getTokens().pgr;
    let collectionId = options.collectionId || config.collectionId;

    let payload = {
      collection_id : collectionId,
      type, text
    };

    return this.service.addSuggestion(payload, jwt);
  }

  findSuggestion(type, text) {
    let collectionId = options.collectionId || config.collectionId;
    return this.service.findSuggestions(collectionId, type, text);
  }

}

module.exports = new SuggestModel();