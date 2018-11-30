const assert = require('assert');
const pgr = require('../admin/lib/pgr');
const data = require('./utils/data');

describe('Collections', function() {

  before(() => {
    pgr.config.jwt = Users.admin.pgrJwt;
  });

  describe('admin methods', async function() {
    it('should create collection', async function(){
      let response = await pgr.createCollection(data.createCollection());
      assert.equal(response.statusCode, 201);
    });

    it('should not let your create another collection with same id', async function(){
      let response = await pgr.createCollection(data.createCollection());
      assert.equal(response.statusCode, 409);
    });

    it('should list collections', async function(){
      let response = await pgr.listCollections();
      assert.equal(response.statusCode, 200);
      let body = JSON.parse(response.body);
      assert.equal(body.length > 0, true);
    });

    it('should remove collection', async function(){
      let response = await pgr.removeCollection(data.createCollection().collection_id);
      assert.equal(response.statusCode, 204);
    });

  });
});