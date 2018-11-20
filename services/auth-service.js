const {BaseService} = require('@ucd-lib/cork-app-utils');
const AuthStore = require('../stores/auth-store');
const firestore = require('../lib/firestore');
const config = require('../config');

class AuthService extends BaseService {

  constructor() {
    this.store = AuthStore;
    this.firebase = firestore.firebase;
    this.cloudFnConfig = config.firestore.cloudFunctions;

    this._initAuthHandler();
  }

  /**
   * @method _initAuthHandler
   * @description
   */
  _initAuthHandler() {
    this.firebase.auth().onAuthStateChanged((user) => {
      if( user ) this.store.setUserLoggedIn(user);
      else this.store.setUserLoggedOut();
    });
  }

  getAnonymousTokens() {
    return this.request({
      url : `${this.cloudFnConfig.host}${this.cloudFnConfig.rootPath}/anonymous-tokens`,
      onLoading : req => this.store.onTokensLoading(req),
      onLoad : res => this.store.onTokenLoad(res.body.firebase, res.body.pgr, true),
      onError : e => this.store.onTokensError(e)
    });
  }

  userLogin(firebaseJwt, pgrJwt) {
    this.store.setTokens(firebaseJwt, pgrJwt);
    return this.firebase.auth().signIn(firebaseJwt);
  }

}

module.exports = new AuthService();