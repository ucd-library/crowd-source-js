const {BaseService} = require('@ucd-lib/cork-app-utils');
const SuggestStore = require('../stores/suggest-store');
const pgrUtils = require('../lib/pgr-utils');
const config = require('../config');

class SuggestService extends BaseService {

  constructor() {
    super();
    this.store = SuggestStore;
  }

  addSuggestion(payload, jwt) {
    // check this
    let response = await this.request({
      url : `${config.pgr.host}/suggest?text=eq.${encodeURIComponent(payload.text)}&type=${payload.type}`
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

  async findSuggestions(collectionId, type, text) {
    text = await pgrUtils.escapeTSVector(text);
    let response = await this.request({
      url : `${config.pgr.host}/suggest?tsv=eq.${encodeURIComponent(text)}&type=${type}&collectionId=${collectionId}`
    });
    return response.body;
  }

}

module.exports = new SuggestService();