const {BaseService} = require('@ucd-lib/cork-app-utils');
const CrowdInputsStore = require('../stores/crowd-inputs-store');
const firestore = require('../lib/firestore');
const config = require('../config');

class CrowdInputsService extends BaseService {

  constructor() {
    super();

    this.collection = config.firestore.collections.crowdInputs;
    this.store = CrowdInputsStore;
  }

  getApprovedByItem(id) {
    return this.request({
      url : `${config.pgr.host}/crowd_inputs?item_id=eq.${id}`,
      onLoading : request => this.store.setApprovedByItemLoading(id, request),
      onLoad : response => {
        let hash = {};
        response.body.forEach(input => {
          input.id = input.crowd_input_id;
          hash[input.crowd_input_id] = input;
        });
        this.store.setApprovedByItemLoaded(id, hash);
      },
      onError : error => this.store.setApprovedByItemError(id, error)
    });
  }

  /**
   * @method getApproved
   * @description get approved crowd input from pgr.
   * 
   * @param {String} id crowd input id
   * @param {Boolean} onlySuccessState only store success state.  This query is
   * used when a crowd input is removed from firestore to see if it was deleted
   * or approved.  If it was delete, we don't want to store state, if it was approved
   * we want to just store the loaded state
   */
  getApproved(id, onlySuccessState=false) {
    return this.request({
      url : `${config.pgr.host}/crowd_inputs?crowd_inputs_id=eq.${id}`,
      onLoading : request => {
        if( onlySuccessState ) return;
        this.store.setApprovedLoading(id, request);
      },
      onLoad : response => {
        if( response.body.length === 0 ) {
          if( onlySuccessState ) return;
          this.store.setApprovedError(id, new Error(`Unknown mark id: ${id}`));
        } else {
          let data = response.body[0];
          data.id = data.crowd_input_id;
          this.store.setApprovedLoaded(id, data);

          // update the item as well
          this.store.mergeApprovedIntoItem(
            id, 
            {[id]: data}
          );
        }
      },
      onError : error => {
        if( onlySuccessState ) return;
        this.store.setApprovedError(id, error);
      }
    });
  }

  async setApproved(crowdInput, jwt) {
    await this.request({
      url : `${config.pgr.host}/crowd_inputs`,
      json : true,
      fetchOptions : {
        method: 'POST',
        headers : {
          Authorization : `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: crowdInput
      },
      onLoading : request => this.store.setPendingApproving(crowdInput, request),
      onLoad : response => this.store.setPendingApproved(crowdInput, response.body),
      onError : error => this.store.setPendingError(id, error)
    });

    await this.removePending(id);

    await this.getApproved(id);
  }

  async removePending(id) {
    try {
      // setup firebase save 
      let promise = firestore.db
        .collection(this.collection)
        .doc(id)
        .delete();

      // set saving state and wait for save to complete
      this.store.setPendingDeleting(id, promise);
      await promise;

      // set loaded state
      this.store.setPendingDeleted(crowdInput.id);
    } catch(e) {
      this.store.setPendingDeleteError(crowdInput.id, e);
      throw e;
    }
  }

  async updatePending(crowdInput) {
    try {
      // setup firebase save 
      let promise = firestore.db
        .collection(this.collection)
        .doc(crowdInput.id)
        .set(crowdInput, {merge: true});

      // set saving state and wait for save to complete
      this.store.setPendingSaving(crowdInput, promise);
      await promise;

      // fetch the current state of document
      let ref = await firestore.db
        .collection(this.collection)
        .doc(crowdInput.id)
        .get();
      crowdInput = ref.data();

      // set loaded state
      this.store.setPendingLoaded(crowdInput.id, crowdInput);

      // update the item as well
      this.store.mergePendingIntoItem(
        crowdInput.itemId, 
        {[crowdInput.id]: crowdInput}
      );
    } catch(e) {
      this.store.setPendingSaveError(crowdInput, e);
      throw e;
    }
  }

  async getPending(id) {
    try {
      // setup firebase query and stash promise
      let promise = firestore.db
        .collection(this.collection)
        .doc(id)
        .get()
      
      // set a loading state, then wait for promise to resolve
      this.store.setPendingLoading(id, promise);
      let doc = await promise;

      if( doc.exists ) {
        this.store.setPendingLoaded(id, doc.data());
      } else {
        this.store.setPendingError(id, new Error('pending crowd input does not exist'));
      }
    } catch(e) {
      this.store.setPendingError(id, e);
      throw e;
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
      throw e;
    }
  }

  async listenPendingByItem(id) {
    // check if we are already listening
    let unsubscribe = this.store.getUnsubscribeByItemId(id);
    if( unsubscribe ) return;

    let updateBuffer = new UpdateBuffer((docs) => {
      // merge with current state of marks
      this.store.mergePendingIntoItem(id, docs);
    });

    let unsubscribe = firestore.db.
      collection(this.collection)
      .where('item_id', '==', id)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          let removed = (change.type === 'removed') ? true : false;
          let docId = change.doc.id;
          let data = change.doc.data();

          // set the new state for the pending input right now
          this.store.setPendingLoaded(docId, data, removed);

          // update state for item after a window has passed with now updates
          updateBuffer.updated(docId, doc, removed);

          // if removed, query to see if crowd input was approved
          if( removed ) {
            try {
              // the true flag here is important!
              this.getApproved(docId, true);
            } catch(e) {}
          }
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

module.exports = new CrowdInputsService();