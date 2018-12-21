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
      user : null,
      state : 'loggedOut'
    });
  }

  /**
   * User will always be the firebase user account
   */
  setUserLoggedIn(firebaseUser, additionalProfile) {
    if( !additionalProfile && this.getUser().additionalProfile ) {
      additionalProfile = this.getUser().additionalProfile;
    }

    this._setUserState({
      firebaseUser,
      additionalProfile,
      state : 'loggedIn'
    });
  }

  setUserAdditionalProfile(additionalProfile) {
    let state = this.getUser() || {};
    state.additionalProfile = additionalProfile;
    this._setTokenState(state);
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

  getPgrToken() {
    let state = this.getTokens();
    if( state && state.payload ) return state.payload.pgr;
    return null;
  }

  getFirebaseToken() {
    let state = this.getTokens();
    if( state && state.payload ) return state.payload.firebase;
    return null;
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

  clearTokens() {
    this._setTokenState({
      payload: null,
      state: 'loggedOut'
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