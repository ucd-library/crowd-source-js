const {BaseStore} = require('@ucd-lib/cork-app-utils');

class AuthStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      tokens : {},
      user : {}
    }

    this.events = {
      AUTH_USER_UPDATE : 'auth-user-update',
      TOKENS_UPDATE : 'auth-tokens-update'
    }
  }

  getUser() {
    return this.data.user;
  }

  setUserLoggedOut() {
    this._setUserState({
      payload : null,
      state : 'loggedOut'
    });
  }

  setUserLoggedIn(user) {
    this._setUserState({
      payload : user,
      state : 'loggedIn'
    });
  }

  _setUserState(newState) {
    if( !this.stateChanged(this.data.user, newState) ) {
      return;
    }
    this.data.user = newState;
    this.emit(this.events.AUTH_UPDATE, this.data.user);
  }

  getTokens() {
    return this.data.tokens;
  }

  setTokensLoading(request) {
    let currentState = this.getTokens() || {};
    this._setTokenState({
      payload : currentState.payload,
      request,
      state : this.STATE.LOADING
    });
  }

  setTokensError(error) {
    let currentState = this.getTokens() || {};
    this._setTokenState({
      payload : currentState.payload,
      error,
      state : this.STATE.ERROR
    });
  }

  setTokensLoaded(firebase, pgr, anonymous) {
    this._setTokenState({
      payload: {firebase, pgr},
      anonymous,
      state: this.STATE.LOADED
    });
  }

  _setTokenState(newState) {
    if( !this.stateChanged(this.data.tokens, newState) ) {
      return;
    }
    this.data.tokens = newState;
    this.emit(this.events.TOKENS_UPDATE, newState);
  }

  

}

module.exports = new AuthStore();