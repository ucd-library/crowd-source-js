// Generate items for test
const _request = require('request');
const admin = require('../../admin');
const clientConfig = require('../../client/config');
const config = require('../../admin/config');

const FIRESTORE_COLLECTIONS = clientConfig.firestore.collections
const COLLECTION_ID = 'test-collection';
const APP_ID = 'testing';
const ITEM_ID = '/collection/testing-collection/testing-test-test';
const CHILD_ITEM_ID = '/collection/testing-collection/testing-test-test/child';
const SCHEMA_ID = 'wine-mark';

class GenerateData {

  createApp() {
    return {
      app_id : APP_ID,
      name : 'Testing app',
      description : 'This is for integration testing'
    }
  }

  createCollection() {
    return {
      collection_id : COLLECTION_ID,
      name : 'A test collection',
      description : 'A collection for the test framework'
    }
  }

  createItemParent() {
    return {
      app_id : APP_ID,
      item_id : ITEM_ID,
      collection_id : COLLECTION_ID,
      editable : true,
      completed : false
    }
  }

  createItemChild() {
    return {
      app_id : APP_ID,
      item_id : CHILD_ITEM_ID,
      collection_id : COLLECTION_ID,
      parent_item_id : ITEM_ID,
      editable : true,
      completed : false,
      index : 0
    }
  }

  createSchema() {
    return {
      schemaId : SCHEMA_ID,
      appId : APP_ID,
      schema : {
        "id": "/WineMark",
        "type": "object",
        "properties": {
          "type" : {
            "type" : "string"
          },
          "name" : {
            "type" : "string"
          },
          "perprice" : {
            "type" : "number"
          }
        },
        "additionalProperties": false,
        "required": [
          "name", "type", "perprice"
        ]
      }
    }
  }

  createCrowdInput(userId) {
    return {
      collectionId : COLLECTION_ID,
      appId : APP_ID,
      itemId : ITEM_ID,
      schemaId : SCHEMA_ID,
      userId,
      data : {
        name : 'foo',
        type : 'bar',
        perprice : Math.random() * 2
      }
    }
  }

  async cleanupPgr() {
    await request(
      `${config.pgr.host}/items?app_id=eq.${APP_ID}&parent_id=not.is.null`,
      {
        method : 'DELETE',
        headers : {
          Authorization : `Bearer ${Users.admin.pgrJwt}`
        }
      }
    );

    await request(
      `${config.pgr.host}/items?app_id=eq.${APP_ID}`,
      {
        method : 'DELETE',
        headers : {
          Authorization : `Bearer ${Users.admin.pgrJwt}`
        }
      }
    );

    await request(
      `${config.pgr.host}/schemas?app_id=eq.${APP_ID}`,
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

    await request(
      `${config.pgr.host}/applications?app_id=eq.${APP_ID}`,
      {
        method : 'DELETE',
        headers : {
          Authorization : `Bearer ${Users.admin.pgrJwt}`
        }
      }
    );
  }

  async cleanupFirestore() {
    let firestore = admin.firebase.firestore;
    
    let query = await firestore
      .collection(FIRESTORE_COLLECTIONS.crowdInputs)
      .where('appId', '==', APP_ID)
      .get()

    for( let doc of query.docs ) {
      await firestore
        .collection(FIRESTORE_COLLECTIONS.crowdInputs)
        .doc(doc.id)
        .delete()
    }

    query = await firestore
      .collection(FIRESTORE_COLLECTIONS.schemas)
      .where('appId', '==', APP_ID)
      .get()

    for( let doc of query.docs ) {
      await firestore
        .collection(FIRESTORE_COLLECTIONS.schemas)
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