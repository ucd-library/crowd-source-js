const assert = require('assert');
const pgr = require('../admin/lib/pgr');
const data = require('./utils/data');

describe('App', function() {

  before(() => {
    pgr.config.jwt = Users.admin.pgrJwt;
  });

  describe('admin methods', async function() {
    it('should create app', async function(){
      let response = await pgr.createApp(data.creatApp());
      assert.equal(response.statusCode, 201);
    });

    it('should not let your create another app with same id', async function(){
      let response = await pgr.createApp(data.creatApp());
      assert.equal(response.statusCode, 409);
    });

    it('should list apps', async function(){
      let response = await pgr.listApps();
      assert.equal(response.statusCode, 200);
      let body = JSON.parse(response.body);
      assert.equal(body.length > 0, true);
    });

    it('should remove app', async function(){
      let response = await pgr.removeApp(data.creatApp().app_id);
      assert.equal(response.statusCode, 204);
    });

  });
});