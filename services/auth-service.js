const {BaseService} = require('@ucd-lib/cork-app-utils');
const AuthStore = require('../stores/auth-store');
const firestore = require('../lib/firestore');

class AuthService extends BaseService {

  constructor() {
    this.store = AuthStore;
    this._initAuthHandler();
  }

  /**
   * @method _initAuthHandler
   * @description
   */
  _initAuthHandler() {
    this.firebase.auth().onAuthStateChanged((user) => {
      this.store.setAuthState(user);
    });
  }

  anonymousLogin() {
    
  }

  userLogin(firebaseJwt, pgrJwt) {
    this.store.setTokens(firebaseJwt, pgrJwt);
    this.firebase.auth().signIn(firebaseJwt);
  }

}

module.exports = new AuthService();