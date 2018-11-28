const {BaseService} = require('@ucd-lib/cork-app-utils');
const SuggestStore = require('../stores/suggest-store');
const pgrUtils = require('../lib/pgr-utils');
const config = require('../config');

class SuggestService extends BaseService {

  constructor() {
    super();
    this.store = SuggestStore;
  }

  add(payload, jwt) {
    // check this
    let response = await this.request({
      url : `${config.pgr.host}/suggest?text=eq.${encodeURIComponent(payload.text)}&domain=eq.${payload.domain}`
    });
    if( response.body.length > 0 ) return; // already exists;

    return this.request({
      url : `${config.pgr.host}/suggest`,
      json : true,
      fetchOptions : {
        method : 'POST',
        body : payload,
        headers : {
          Prefer : 'return=representation',
          Authorization : `Bearer ${jwt}`
        }
      }
    });
  }

  async find(appId, collectionId, domain, text) {
    text = await pgrUtils.escapeTSVector(text);
    let response = await this.request({
      url : `${config.pgr.host}/suggest?tsv=@@.${encodeURIComponent(text)}&domain=eq.${domain}&collection_id=eq.${collectionId}&app_id=eq.${appId}`
    });
    return response.body;
  }

  async all(appId, collectionId, domain) {
    let response = await this.request({
      url : `${config.pgr.host}/suggest?select=text&domain=eq.${domain}&collection_id=eq.${collectionId}&app_id=eq.${appId}`
    });
    return response.body;
  }

}

module.exports = new SuggestService();