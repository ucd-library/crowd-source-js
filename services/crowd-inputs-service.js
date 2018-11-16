const {BaseService} = require('@ucd-lib/cork-app-utils');
const CrowdInputsStore = require('../stores/CrowdInputsStore');
const firestore = require('../lib/firestore');
const config = require('../config');

class CrowdInputsService extends BaseService {

  constructor() {
    super();

    this.collection = config.firestore.collections.crowdInputs;
    this.store = CrowdInputsStore;
  }

  async addPending(crowdInput) {
    try {
      // setup firebase save 
      let promise = firestore.db
        .collection(this.collection)
        .doc(crowdInput.id)
        .set(crowdInput);

      // set saving state and wait for save to complete
      this.store.setPendingSaving(crowdInput, promise);
      await promise;

      // set loaded state
      this.store.setPendingLoaded(crowdInput.id, crowdInput);

      // update the item as well
      this.mergePendingIntoItem(
        crowdInput.itemId, 
        {[crowdInput.id]: crowdInput}
      );
    } catch(e) {
      this.store.setPendingSaveError(crowdInput.id, e);
    }
  }

  async getPendingByItem(id) {
    try {
      // setup firebase query and stash promise
      let promise = firestore.db
        .collection(this.collection)
        .where('item_id', '==', id)
        .get()
      
      // set a loading state, then wait for promise to resolve
      this.store.setPendingByItemLoading(id, promise);
      let querySnapshot = await promise;

      // create doc hash and set loaded
      let docs = {};
      querySnapshot.forEach((doc) => {
        docs[doc.id] = doc.getData();
      });
      this.store.setPendingByItemLoaded(id, docs);
    } catch(e) {
      this.store.setPendingByItemError(id, e);
    }
  }

  async listenPendingByItem(id) {
    // check if we are already listening
    let unsubscribe = this.store.getUnsubscribeByItemId(id);
    if( unsubscribe ) return;

    let updateBuffer = new UpdateBuffer((docs) => {
      // merge with current state of marks
      this.mergePendingIntoItem(id, docs);
    });

    let unsubscribe = firestore.db.
      collection(this.collection)
      .where('item_id', '==', id)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          let removed = (change.type === 'removed') ? true : false;
          let id = change.doc.id;
          let data = change.doc.data();

          // set the new state for the pending input right now
          this.store.setPendingLoaded(id, data, removed);

          // update state for item after a window has passed with now updates
          updateBuffer.updated(id, doc, removed);
        });
      });
    
    this.store.setUnsubscribeByItem(id, unsubscribe);
  }

}

class UpdateBuffer {
  constructor(fn) {
    this.timer = -1;
    this.bufferTime = 50;
    this.fn = fn;
    this.docs = {};
  }
  
  updated(id, doc, removed) {
    this.docs[id] = {doc, removed};
    if( this.timer !== -1 ) clearTimeout(this.timer);
    
    this.timer = setTimeout(() => {
      this.timer = -1;
      this.fn(docs);
      this.docs = {};
    });
  }
}

module.exports = CrowdInputsService();