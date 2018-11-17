const assert = require('assert');
const model = require('../../models/crowd-inputs-model');
const firestore = require('../../lib/firestore');

const COLLECTION_ID = 'test-collection';
const APP_ID = 'test-app';
const ITEM_ID = '/collection/testing-collection/testing-test-test';
const TEST_DATA = {
  foo : 'bar',
  baz : [1,2,3]
};

describe('Crowd Inputs: Pending', function() {

  before(async () => {
    await firestore.signIn(Users.alice.firestore);
  });

  describe('create', async function() {
    it('should let alice add a pending crowd input', async function(){
      let crowdInput = {
        collectionId : COLLECTION_ID,
        appId : APP_ID,
        itemId : ITEM_ID,
        userId : 'alice',
        data : TEST_DATA
      };

      let state = await model.addPending(crowdInput);
      
      assert.deepEqual({
        id : state.id,
        payload: crowdInput,
        state : 'loaded',
        deleted : false
      }, state);
    });
  });

});

