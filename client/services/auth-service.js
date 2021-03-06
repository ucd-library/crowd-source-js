const {BaseService} = require('@ucd-lib/cork-app-utils');
const AuthStore = require('../stores/auth-store');
const firestore = require('../lib/firestore');
const config = require('../config');

class AuthService extends BaseService {

  constructor() {
    super();
    
    this.store = AuthStore;
    this.firebase = firestore.firebase;
    this.cloudFnConfig = config.firestore.cloudFunctions;

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

  async userLogin(firebaseJwt, pgrJwt) {
    this.store.setTokensLoaded(firebaseJwt, pgrJwt);
    await this.firebase.auth().signInWithCustomToken(firebaseJwt);
  }

  logout() {
    this.store.clearTokens();
    return this.firebase.auth().signOut();
  }

}

module.exports = new AuthService();