const {BaseService} = require('@ucd-lib/cork-app-utils');
const Auth0Store = require('../stores/auth0-store');

class Auth0Service extends BaseService {

  constructor() {
    this.store = Auth0Store;
  }

  /**
   * @method login
   * @description login with Auth0 jwt
   * 
   * @param {*} jwtToken 
   */
  login(jwtToken) {

  }

}

module.exports = new Auth0Service();