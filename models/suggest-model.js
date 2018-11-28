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

  /**
   * @method add
   * @description add text suggestion or controlled vocabulary for application.  must be admin.
   * 
   * @param {String} domain domain of suggestion.  ex: wine-name
   * @param {String} text text for suggestion or controlled vocabulary 
   * @param {Object} options Optional args
   * @param {String} options.jwt override AuthStore PGR JWT token used
   * @param {String} options.collectionId override default config collectionId
   * @param {String} options.appId default config appId
   */
  add(domain, text, options={}) {
    let jwt = options.jwt || AuthStore.getTokens().pgr;
    let collectionId = options.collectionId || config.collectionId;
    let appId = options.appId || config.appId;

    let payload = {
      collection_id : collectionId,
      app_id : appId,
      domain, text
    };

    return this.service.add(payload, jwt);
  }

  /**
   * @method find
   * @description get text suggestions or controlled vocabulary for application.
   * 
   * @param {String} domain domain of suggestion.  ex: wine-name
   * @param {String} text text for suggestion or controlled vocabulary 
   * @param {Object} options Optional args
   * @param {String} options.collectionId override default config collectionId
   * @param {String} options.appId default config appId
   */
  find(domain, text, options={}) {
    let appId = options.appId || config.appId;
    let collectionId = options.collectionId || config.collectionId;
    return this.service.find(appId, collectionId, domain, text);
  }

  /**
   * @method all
   * @description get all text suggestions or controlled vocabulary for domain.
   * 
   * @param {String} domain domain of suggestion.  ex: wine-name
   * @param {Object} options Optional args
   * @param {String} options.collectionId override default config collectionId
   * @param {String} options.appId default config appId
   */
  all(domain, options={}) {
    let appId = options.appId || config.appId;
    let collectionId = options.collectionId || config.collectionId;
    return this.service.all(appId, collectionId, domain);
  }

}

module.exports = new SuggestModel();