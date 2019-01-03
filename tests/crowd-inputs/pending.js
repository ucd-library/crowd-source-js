const assert = require('assert');
const model = require('../../client/models/crowd-inputs-model');
const auth = require('../../client/models/auth-model');
const admin = require('../../admin')
const firestore = require('../../client/lib/firestore');
const data = require('../utils/data');


let crowdInput;

describe('Crowd Inputs: Pending', function() {

  before(async function() {
    await auth.userLogin(
      Users.alice.firestoreJwt,
      Users.alice.pgrJwt
    );
    await admin.firebase.setSchema(data.createSchema());
  });

  describe('create', async function() {
    it('should let alice add a pending crowd input', async function() {
      this.timeout(10000);

      crowdInput = data.createCrowdInput(Users.alice.userId);
      let state = await model.addPending(crowdInput);

      assert.deepEqual({
        id : state.id,
        payload: crowdInput,
        state : 'loaded',
        deleted : false
      }, state);
    });


    it('should let alice update a pending crowd input', async function(){
      this.timeout(10000);
      
      crowdInput.data.type = 'red'
      let state = await model.updatePending(crowdInput);
    
      assert.deepEqual({
        id : state.id,
        payload: crowdInput,
        state : 'loaded',
        deleted : false
      }, state);
    });

    it('should not let bob update alices pending crowd input', async function(){
      await firestore.signIn(Users.bob.firestoreJwt);

      let state = await model.updatePending({
        id : crowdInput.id,
        data : {
          bobUpdate : 'badness'
        }
      });
      
      assert.equal('save-error', state.state);
      assert.equal(typeof state.error, 'object');
    });

    it('should let alice delete a pending crowd input', async function(){
      await firestore.signIn(Users.alice.firestoreJwt);
      let state = await model.removePending(crowdInput.id);

      assert.equal(state.state, 'loaded');
      assert.equal(state.deleted, true);
    });

    after(async function() {
      let schema = data.createSchema();
      await admin.firebase.removeSchema(schema.appId, schema.schemaId);
    });

  });

});

