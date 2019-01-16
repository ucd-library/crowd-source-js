const assert = require('assert');
const model = require('../../client/models/crowd-inputs-model');
const auth = require('../../client/models/auth-model');
const admin = require('../../admin')
const firestore = require('../../client/lib/firestore');
const data = require('../utils/data');


let crowdInput;

describe('Crowd Inputs: Approve', function() {

  before(async function() {
    this.timeout(10000);
    await auth.userLogin(
      Users.alice.firestoreJwt,
      Users.alice.pgrJwt
    );
    await admin.firebase.setSchema(data.createSchema());
    crowdInput = data.createCrowdInput(Users.alice.userId);
    await model.addPending(crowdInput);
  });

  describe('create', async function() {
    it('should let alice vote for a pending crowd input', async function() {
      this.timeout(10000);
      let state = await model.votePending(crowdInput.id, {value: 1});

      assert.deepEqual(
        {
          'alice@test.org': {value:1}
        }, 
        state.payload.votes
      );
    });

    it('should let alice change vote for a pending crowd input', async function() {
      this.timeout(10000);
      let state = await model.votePending(crowdInput.id, {value: 5});
      assert.deepEqual(
        {
          'alice@test.org': {value:5}
        }, 
        state.payload.votes
      );
    });

    it('should let alice remove vote for a pending crowd input', async function() {
      this.timeout(10000);
      let state = await model.removeVotePending(crowdInput.id);

      assert.deepEqual(
        {}, 
        state.payload.votes
      );
    });


    after(async function() {
      let schema = data.createSchema();
      await admin.firebase.removeSchema(schema.appId, schema.schemaId);
      await model.removePending(crowdInput.id);
    });

  });

});