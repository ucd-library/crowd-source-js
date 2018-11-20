const {BaseService} = require('@ucd-lib/cork-app-utils');
const Auth0Store = require('../stores/auth0-store');
const AuthStore = require('../stores/auth-store');

class Auth0Service extends BaseService {

  constructor() {
    this.store = Auth0Store;
  }

  /**
   * @method getUserTokens
   * @description get firebase and pgr jwt tokens from Auth0 jwt
   * 
   * @param {*} jwtToken 
   */
  getUserTokens(jwtToken) {
    return this.request({
      url : `${this.cloudFnConfig.host}${this.cloudFnConfig.rootPath}/user-tokens`,
      fetchOptions : {
        method : 'POST',
        body : jwtToken
      },
      onLoading : req => AuthStore.store.onTokensLoading(req),
      onLoad : res => AuthStore.store.onTokenLoad(res.body.firebase, res.body.pgr),
      onError : e => AuthStore.store.onTokensError(e)
    });
  }

}

module.exports = new Auth0Service();