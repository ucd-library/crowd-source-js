const {BaseStore} = require('@ucd-lib/cork-app-utils');

class AuthStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      user : {}
    }

    this.events = {
      AUTH0_USER_UPDATE : 'auth0-user-update'
    }
  }

  getUser() {
    return this.data.user;
  }

  setUserLoggedOut() {
    this._setUserState({
      payload : null,
      state : 'logged-out'
    });
  }

  setUserLoggingIn() {
    this._setUserState({
      state : 'logging-in'
    });
  }

  setUserLoggingError() {
    this._setUserState({
      state : 'login-error'
    });
  }

  setUserLoggedIn(user) {
    this._setUserState({
      payload : user,
      state : 'logged-in'
    });
  }

  _setUserState(newState) {
    if( !this.stateChanged(this.data.user, newState) ) {
      return;
    }
    this.data.user = newState;
    this.emit(this.events.AUTH0_USER_UPDATE, this.data.user);
  }

}