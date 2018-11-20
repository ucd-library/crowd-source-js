const {BaseModel} = require('@ucd-lib/cork-app-utils');
const Auth0 = require('auth0-js');
const Auth0Lock = require('auth0-lock').default;
const AuthModel = require('./auth-model');
const AuthStore = require('../stores/auth-store');
const Auth0Service = require('../services/auth0-service');
const Auth0Store = require('../stores/auth0-store');
const config = require('../config');

class Auth0Model extends BaseModel {

  constructor() {
    this.service = Auth0Service;
    this.store = Auth0Store;
    this.config = config.auth0;

    if( typeof window !== 'undefined' ) {
      // login UI
      this.lock = new Auth0Lock(this.config.clientID, this.config.domain, this.config.lockOptions);
      // used for silent login
      this.auth0WebAuth = new Auth0.WebAuth({clientID: this.config.clientID, domain: this.config.domain});
    }

    // auth0 library used for things like delegation 
    this.auth0 = new Auth0.Authentication({clientID: this.config.clientID, domain: this.config.domain});
    

    this.EventBus.on(AuthStore.events.AUTH_USER_UPDATE, e => this._handleAppAuthEvents(e));
  
    this.register('Auth0Model');
  }

  /**
   * @method login
   * @description login with Auth0 via lock UI library.  Stores current hash
   * in localstorage so user can be redirected after login flow.
   */
  login() {
    localStorage.setItem(config.auth0.localStorageKeys.redirectHash, window.location.hash);
    this.lock.show();
  }

  /**
   * @method isRedirect
   * @description check if the window state is an Auth0 redirect.  if it is, the Auth0
   * Lock widget will finish authentication.  will return true/false based on hash state.
   * Optionally, if the window hash is not a Auth0 redirect, attempt a silent login.
   * 
   * @param {Boolean} autoRenew attempt auto renew if this is not a silent login
   * 
   * @return {Boolean}
   */
  isRedirect(autoRenew=false) {
    var hash = '?'+this.window.location.hash.replace(/^#/,'');

    // this is crap. need to check for auth0 redirect hash parameters in url
    if( this._getParamByName('error', hash) || 
        (this._getParamByName('access_token', hash) && 
        this._getParamByName('id_token', hash)) ) {

        this._resumeAuth(this.window.location.hash);
        return true;
    } else if( autoRenew ) {
      this.initAuthRenewAuth0();
    }
    return false;
  }

  /**
   * @method loginJwt
   * @description finish login flow passing auth0 jwt token to jwt token creation service 
   */
  loginJwt(jwtToken) {
    try {
      await this.service.login(jwtToken);
    } catch(e) {}

    let tokens = AuthStore.getTokens();
    if( tokens.state !== 'loaded' ) {
      throw new Error('Tokens in bad state: ', tokens);
    }

    await AuthModel.userLogin(tokens.firebase, tokens.pgr);

    return AuthStore.getUser();
  }

  /**
   * @method initAuthRenewAuth0
   * @description initialize auto renew function.  If window is still loading,
   * register to onload handler, otherwise call autoRenew.  Call this if you want
   * to use autoRenew service
   * 
   */
  initAuthRenewAuth0() {
    if( typeof window === 'undefined' ) return;

    if( window.document.body ) {
      this.autoRenew();
    } else {
      window.onload = this.autoRenew.bind(this);
    }
  }

  /**
   * @method autoRenewAuth0
   * @description run auth0 auto login function via messaging between silent-login.html
   * and this page.
   */
  autoRenew() {
    // TODO: get this working... docs suck
    // https://auth0.com/docs/libraries/auth0js/v8#using-checksession-to-acquire-new-tokens
    // this.auth0WebAuth.checkSession({
      
    // }, (e, result) => {
    //   this._autoRenewComplete(e, result)
    // });

    this.auth0WebAuth.renewAuth({
      scope: this.config.scope,
      redirectUri: window.location.protocol+'//'+window.location.host+config.auth0.autoRenew.path,
      usePostMessage: true
    }, (e, result) => this._autoRenewComplete(e, result));
  }

  /**
   * @method _autoRenewComplete
   * @description fired when auth0 auto login completes.
   * 
   * @param {Object} err 
   * @param {Object} authResult 
   */
  _autoRenewComplete(err, authResult) {
    if( err ) {
      console.log('Silent login failed, logging out', err);
      return this.logout();
    }

    console.log('Silent login success, token renewed');
    this._getProfileFinishLogin(authResult);
  }

  /**
   * @method resumeAuth
   * @description after the loginAuth0 completes redirect flow, the user will
   * end up back at this app with a token in the url hash.  The price-the-vinage
   * element looks for these token values on load.  If found it means we need
   * to finish the login flow, which happens below
   * 
   * @param {String} hash current url location hash
   */
  _resumeAuth(hash) {
    return new Promise((resolve, reject) => {

      // call lock UI's resume with current hash
      this.lock.resumeAuth(hash, (error, authResult) => {
        if (error) {
          return alert("Could not parse hash");
        }

        // see if we need to redirect the user
        var oldHash = window.localStorage.getItem(config.auth0.localStorageKeys.redirectHash);
        if( oldHash ) {
          window.location.hash = oldHash;
          localStorage.removeItem(config.auth0.localStorageKeys.redirectHash);
        } else {
          window.location.hash = '';
        }

        try {
          await this._getProfileFinishLogin(authResult);
          resolve();
        } catch(e) {
          reject(e);
        }

      });
    });  
  }

  /**
   * @method _getProfileFinishLogin
   * @description after the Auth0 Lock widget finishes, get the Auth0 user profile,
   * set the Auth0 logged in state, then finish firebase/pgr login. 
   */
  _getProfileFinishLogin(authResult) {
    return new Promise((resolve, reject) => {
      // grab the the Auth0 user profile
      this.lock.getUserInfo(authResult.accessToken, async (error, profile) => {
        if( error ) throw error;

        this.store.setUserLoggedIn({authResult, profile});

        try {
          await this.loginJwt(authResult.idToken);
          resolve();
        } catch(e) {
          reject(e);
        }
      });
    });
  }

  // TODO: handle logout...
  _handleAppAuthEvents(e) {
    
  }

  /**
   * @method _getParamByName
   * @description helper method for extracting query parameters from url
   */
  _getParamByName(name, url) {
    if (!url) {
      url = this.window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

}

module.exports = new Auth0Model();