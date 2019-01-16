const assert = require('assert');
const model = require('../../client/models/crowd-inputs-model');
const auth = require('../../client/models/auth-model');
const admin = require('../../admin')
const pgr = require('../../admin/lib/pgr');
const firestore = require('../../client/lib/firestore');
const data = require('../utils/data');


let crowdInput;

describe('Crowd Inputs: Approve', function() {

  before(async function() {
    this.timeout(20000);

    pgr.config.jwt = Users.admin.pgrJwt;
    await admin.pgr.createApp(data.createApp());
    await admin.pgr.createCollection(data.createCollection());
    await admin.pgr.addItem(data.createItemParent());
    await admin.firebase.setSchema(data.createSchema());

    await auth.userLogin(
      Users.alice.firestoreJwt,
      Users.alice.pgrJwt
    );
    
    crowdInput = data.createCrowdInput(Users.alice.userId);
    await model.addPending(crowdInput)

    await auth.userLogin(
      Users.admin.firestoreJwt,
      Users.admin.pgrJwt
    );
  });

  describe('create', async function() {
    it('should let admin approve pending crowd input', async function() {
      this.timeout(10000);

      let response = await pgr.listRootItems(data.createItemParent().app_id);
      assert.equal(response.statusCode, 200);
      let body = JSON.parse(response.body);
      console.log(body);

      console.log(crowdInput);
      let state = await model.setApproved(crowdInput.id);
      console.log('state', state);

      // assert.deepEqual({
      //   id : state.id,
      //   payload: crowdInput,
      //   state : 'loaded',
      //   deleted : false
      // }, state);
    });
  });

  after(async function() {
    let schema = data.createSchema();
    await admin.firebase.removeSchema(schema.appId, schema.schemaId);

    await admin.pgr.removeItem(data.createItemParent().app_id, data.createItemParent().item_id);
    await admin.pgr.removeCollection(data.createCollection().collection_id);
    await admin.pgr.removeApp(data.createApp().app_id);
    
  });

});
