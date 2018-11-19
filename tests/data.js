// Generate items for test
const _request = require('request');
const firestore = require('../lib/firestore');
const config = require('../config');

const FIRESTORE_COLLECTIONS = config.firestore.collections
const COLLECTION_ID = 'test-collection';
const APP_ID = 'testing';
const ITEM_ID = '/collection/testing-collection/testing-test-test';

class GenerateData {

  createCollection() {
    return {
      collection_id : COLLECTION_ID,
      name : 'A test collection',
      description : 'A collection for the test framework'
    }
  }

  createItem() {
    return {
      item_id : ITEM_ID,
      collection_id : COLLECTION_ID,
      parent_id : null,
      editable : true,
      completed : false,
      index : null
    }
  }

  createCrowdInput(userId) {
    return {
      collectionId : COLLECTION_ID,
      appId : APP_ID,
      itemId : ITEM_ID,
      userId,
      data : {
        foo : 'bar',
        baz : [Math.random(), Math.random()],
        date : new Date().toISOString()
      }
    }
  }

  async cleanupPgr() {
    let response = await request(
      `${config.pgr.host}/items?collection_id=eq.${COLLECTION_ID}`,
      {
        method : 'DELETE',
        headers : {
          Authorization : `Bearer ${Users.admin.pgrJwt}`
        }
      }
    );

    await request(
      `${config.pgr.host}/collections?collection_id=eq.${COLLECTION_ID}`,
      {
        method : 'DELETE',
        headers : {
          Authorization : `Bearer ${Users.admin.pgrJwt}`
        }
      }
    );
  }

  async cleanupFirestore() {
    await firestore.signIn(Users.admin.firestoreJwt);

    let query = await firestore.db
      .collection(FIRESTORE_COLLECTIONS.crowdInputs)
      .where('appId', '==', APP_ID)
      .get()

    for( let doc of query.docs ) {
      await firestore.db
        .collection(FIRESTORE_COLLECTIONS.crowdInputs)
        .doc(doc.id)
        .delete()
    }
  }

}

function request(uri, options) {
  return new Promise((resolve, reject) => {
    _request(uri, options, (error, response) => {
      if( error ) reject(error);
      else resolve(response);
    });
  });
}

module.exports = new GenerateData();