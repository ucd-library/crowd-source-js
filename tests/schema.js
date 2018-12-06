const assert = require('assert');
const pgr = require('../admin/lib/pgr');
const firebase = require('../admin/lib/firebase');
const data = require('./utils/data');

describe('Crowd Input Data Schema', function() {

  before(async () => {
    pgr.config.jwt = Users.admin.pgrJwt;
    await pgr.createApp(data.createApp());
  });

  describe('admin methods', async function() {
    it('should create schema', async function(){
      let response = await pgr.addAppSchema(data.createSchema());
      assert.equal(response.statusCode, 201);
    });

    it('should not let your create another schema with same id', async function(){
      let response = await pgr.addAppSchema(data.createSchema());
      assert.equal(response.statusCode, 409);
    });

    it('should list application schema', async function(){
      let response = await pgr.listAppSchemas(data.createSchema().app_id);
      assert.equal(response.statusCode, 200);
      let body = JSON.parse(response.body);
      assert.equal(body.length > 0, true);

      let querySnaphsot = await firebase.listSchemas();
      for( let doc of querySnaphsot.docs ){
        console.log(doc.data);
      }
      assert.equal(querySnaphsot.docs.length > 0, true);
    });

    it('should remove schema', async function(){
      let schema = data.createSchema();
      let response = await pgr.removeAppSchema(schema.app_id, schema.schema_id);
      assert.equal(response.statusCode, 204);

      let querySnaphsot = await firebase.listSchemas();
      for( let doc of querySnaphsot.docs ){
        console.log(doc.data);
      }
    });

  });

  after(async () => {
    await pgr.removeApp(data.createApp().app_id);
  });
});