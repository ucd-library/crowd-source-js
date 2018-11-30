const assert = require('assert');
const pgr = require('../admin/lib/pgr');
const data = require('./utils/data');

describe('Items', function() {

  before(async () => {
    pgr.config.jwt = Users.admin.pgrJwt;
    await pgr.createApp(data.createApp());
    await pgr.createCollection(data.createCollection());
  });

  describe('admin methods', async function() {
    it('should create a parent item', async function(){
      let response = await pgr.addItem(data.createItemParent());
      assert.equal(response.statusCode, 201);
    });

    it('should not let your create another item with same id', async function(){
      let response = await pgr.addItem(data.createItemParent());
      assert.equal(response.statusCode, 409);
    });

    it('should create a child item', async function(){
      let response = await pgr.addItem(data.createItemChild());
      assert.equal(response.statusCode, 201);
    });

    it('should list application root items', async function(){
      let response = await pgr.listRootItems(data.createItemParent().app_id);
      assert.equal(response.statusCode, 200);
      let body = JSON.parse(response.body);
      assert.equal(body.length > 0, true);
    });

    it('should list application child items', async function(){
      let response = await pgr.listChildItems(data.createItemChild().app_id, data.createItemParent().item_id);
      assert.equal(response.statusCode, 200);
      let body = JSON.parse(response.body);
      assert.equal(body.length > 0, true);
    });

    it('should remove items', async function(){
      let response = await pgr.removeItem(data.createItemChild().app_id, data.createItemChild().item_id);
      assert.equal(response.statusCode, 204);
      response = await pgr.removeItem(data.createItemParent().app_id, data.createItemParent().item_id);
      assert.equal(response.statusCode, 204);
    });

  });

  after(async () => {
    await pgr.removeApp(data.createApp().app_id);
    await pgr.removeCollection(data.createCollection().collection_id);
  });
});