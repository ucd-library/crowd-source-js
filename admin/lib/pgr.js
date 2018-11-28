const request = require('./request');
const config = require('../config');

class AdminPgr {

  createApp(payload, jwt) {
    if( !jwt ) jwt = config.pgr.jwt;
    return request(`${config.pgr.host}/applications`, {
      method : 'POST',
        body : JSON.stringify(payload),
        headers : {
          Prefer : 'return=representation',
          Authorization : `Bearer ${jwt}`
        }
    });
  }

  listApps() {
    return request(`${config.pgr.host}/applications`);
  }

}

module.exports = new AdminPgr();