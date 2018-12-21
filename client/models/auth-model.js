const {BaseModel} = require('@ucd-lib/cork-app-utils');
const AuthService = require('../services/auth-service');
const AuthStore = require('../stores/auth-store');
const firestore = require('../lib/firestore');

class AuthModel extends BaseModel {

  constructor() {
    super();

    this.service = AuthService;
    this.store = AuthStore;
    this.firestore = firestore.firebase;

    this.register('AuthModel');
  }

  /**
   * @method logout
   * @description log user out of firebase, discard firebase and pgr JWTs
   * 
   * @returns {Promise}
   */
  logout() {
    return this.service.logout();
  }

  /**
   * @method userLogin
   * @description given a firebase and pgr jwt, sign a user into firebase
   * and store both tokens
   */
  async userLogin(firebaseJwt, pgrJwt) {
    try {
      await this.service.userLogin(firebaseJwt, pgrJwt);
    } catch(e) {}

    return this.store.getUser();
  }

  /**
   * @method anonymousLogin
   * @description login as anonymous user
   */
  async anonymousLogin() {
    try {
      await this.service.getAnonymousTokens();
    } catch(e) {}

    let tokens = this.store.getTokens();
    if( tokens.state !== 'loaded' ) {
      throw new Error('Tokens in bad state: ', tokens);
    }

    await this.firebase.auth().signIn(tokens.payload.firebase);

    return this.store.getUser();
  }

}

module.exports = new AuthModel();