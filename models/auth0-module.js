const {BaseModel} = require('@ucd-lib/cork-app-utils');
const AuthModel = require('./auth-model');
const Auth0Service = require('../services/auth0-service');
const Auth0Store = require('../stores/auth0-store');
const uuid = require('uuid');
const config = require('../config');
const clone = require('clone');

class Auth0Model extends BaseModel {

  constructor() {
    this.service = Auth0Service;
    this.store = Auth0Store;
  }

  /**
   * @method loginAuth0
   * @description login with Auth0 via lock UI library.  Stores current hash
   * in localstorage so user can be redirected after login flow.
   */
  login() {
    localStorage.setItem('auth-redirect-hash', window.location.hash);
    this.lock.show();
  }

  loginJwt(jwtToken) {
    let tokens = await this.service.login(jwtToken);
    AuthModel.userLogin(tokens.firebase, tokens.pgr);
  }

  /**
   * @method initAuthRenewAuth0
   * @description initialize auto renew function.  If window is still loading,
   * register to onload handler, otherwise call autoRenew
   * 
   */
  initAuthRenewAuth0() {
    if( typeof window === 'undefined' ) return;

    if( window.document.body ) {
      this.autoRenewAuth0();
    } else {
      window.onload = this.autoRenewAuth0.bind(this);
    }
  }

  /**
   * @method autoRenewAuth0
   * @description run auth0 auto login function via messaging between silent-login.html
   * and this page.
   */
  autoRenew() {
    var userData = this.getUserProfile();
    if( !userData ) return;

    // TODO: get this working... docs suck
    // https://auth0.com/docs/libraries/auth0js/v8#using-checksession-to-acquire-new-tokens
    // this.auth0WebAuth.checkSession({
      
    // }, (e, result) => {
    //   this._autoRenewAuth0Complete(e, result)
    // });

    this.auth0WebAuth.renewAuth({
      scope: this.config.scope,
      redirectUri: window.location.protocol+'//'+window.location.host+'/silent-login.html',
      usePostMessage: true
    }, (e, result) => this._autoRenewAuth0Complete(e, result));
  }

  /**
   * @method continueLogin
   * @description after the loginAuth0 completes redirect flow, the user will
   * end up back at this app with a token in the url hash.  The price-the-vinage
   * element looks for these token values on load.  If found it means we need
   * to finish the login flow, which happens below
   * 
   * @param {String} hash current url location hash
   */
  _continueLogin(hash) {
    return new Promise((resolve, reject) => {

      // call lock UI's resume with current hash
      this.lock.resumeAuth(hash, (error, authResult) => {
        if (error) {
          return alert("Could not parse hash");
        }

        // see if we need to redirect the user
        var oldHash = window.localStorage.getItem('auth-redirect-hash');
        if( oldHash ) {
          window.location.hash = oldHash;
          localStorage.removeItem('auth-redirect-hash');
        } else {
          window.location.hash = '';
        }

        // grab the the Auth0 user profile
        this.lock.getUserInfo(authResult.accessToken, async (error, profile) => {
          if( error ) throw error;

          // set the profiles Auth0 Token
          profile.auth0Token = authResult.idToken;
          this.setUserProfile(profile);

          try {
            await this.loginJwt(profile.auth0Token);
            resolve();
          } catch(e) {
            reject(e);
          }

        });

      });
    });  
  }

}

module.exports = new Auth0Model();