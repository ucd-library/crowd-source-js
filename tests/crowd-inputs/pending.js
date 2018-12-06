const assert = require('assert');
const model = require('../../client/models/crowd-inputs-model');
const firestore = require('../../client/lib/firestore');
const data = require('../utils/data');


let crowdInput;

describe('Crowd Inputs: Pending', function() {

  before(async () => {
    await firestore.signIn(Users.alice.firestoreJwt);
  });

  describe('create', async function() {
    it('should let alice add a pending crowd input', async function(){
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
      let state = await model.updatePending({
        id : crowdInput.id,
        data : {
          testUpdate : 'updated'
        }
      });
      
      crowdInput.data.testUpdate = 'updated';
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
      let state = await model.removePending(crowdInput.id);
      assert.equal(state.state, 'loaded');
      assert.equal(state.deleted, true);
    });

  });

});

