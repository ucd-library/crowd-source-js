const assert = require('assert');
const admin = require('../admin');
const data = require('./utils/data');

describe('Crowd Input Data Schema', function() {

  // before(async () => {
  //   await pgr.createApp(data.createApp());
  // });

  describe('admin methods', async function() {
    it('should create schema', async function(){
      try {
        await admin.firebase.setSchema(data.createSchema());
        assert.equal(true, true);
      } catch(e) {
        assert.equal(e, null, 'Failed to write schema');
      }
    });

    it('should get schema', async function(){
      let schema = data.createSchema();
      schema = await admin.firebase.getSchema(schema.appId, schema.schemaId);
      assert.notEqual(schema, null);
    });

    it('should list application schema', async function(){
      let schemas = await admin.firebase.listSchemas();
      assert.equal(schemas.length > 0, true);
    });

    it('should remove schema', async function(){
      let schema = data.createSchema();
      await admin.firebase.removeSchema(schema.appId, schema.schemaId);
      
      schema = await admin.firebase.getSchema(schema.appId, schema.schemaId);
      assert.equal(schema, null);
    });

  });

  // after(async () => {
  //   await pgr.removeApp(data.createApp().app_id);
  // });
});