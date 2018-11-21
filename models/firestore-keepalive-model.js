const {BaseModel} = require('@ucd-lib/cork-app-utils');
const CrowdInputsModel = require('./CrowdInputsModel');
const PresenceModel = require('./PresenceModel');

// number of seconds to query for interested parties
var QUERY_INTERVAL = 20; 

/**
 * Controller for handling unregistering firebase listeners that are no longer used.
 */
class FirestoreKeepaliveModel extends BaseModel {

  constructor() {
    super();

    this.responses = {};
    this.awaitingResponses = false;
    this.bufferTimer = -1;

    this.models = {
      'crowd-inputs' : CrowdInputsModel,
      'presence' : PresenceModel
    }

    // run every QUERY_INTERVAL seconds
    setInterval(this.query.bind(this), QUERY_INTERVAL * 1000);

    this.TYPES = {
      CROWD_INPUT : 'crowd-input',
      PRESENCE : 'presence'
    }

    this.events = {
      FIRESTORE_KEEPALIVE_REQUEST : 'firestore-keepalive-request'
    }

    this.register('FirestoreKeepaliveModel');
  }
  
  /**
   * @method addModel
   * @description add a model that can should use the keepalive cleanup service
   * 
   * @param {String} eventName ex: 'crowd-input'
   * @param {Object} model model class instance
   */
  addModel(eventName, model) {
    this.models[eventName] = model;
    this.TYPES[eventName.toUpperCase().replace(/-/g, '_')] = eventName;
  }

  /**
   * @method query
   * @description Start the polling process.  This sends a single event that 
   * elements who listen to Firebase realtime resources should listen for.  They 
   * should then send back a interested-party-response when received.  These responses 
   * will be buffered in the 'responses' buy resource type.  After 100ms of no responses
   * resources will be 'cleaned' (disconnected from firebase) based on resource
   * id/type that did NOT respond.
   */
  query() {
    this.responses = {};
    this.awaitingResponses = true;
    this.EventBus.emit(this.events.INTERESTED_PARTY_REQUEST, {TYPES: this.TYPES});
    this.onResponse();
  }

  /**
   * @method onResponse
   * @description Handle interested-party-response
   * 
   * @param {Object} e - event bus event
   * @param {Object} e.id - resource id
   * @param {Object} e.types - resource type. Array of types of interests, currently 'presence', or 'crowd-input' are supported.
   */
  onResponse(e) {
    // proly badness
    if( !this.awaitingResponses ) {
      return console.warn('Received firestore keepalive response, but not expecting it');
    }

    // add to buffer
    if( e ) {
      e.types.forEach((type) => {
        if( !this.responses[type] ) {
          this.responses[type] = {};
        }

        if( e.ids ) {
          e.ids.forEach(id => this.responses[type][id] = true);
        } else {
          this.responses[type][e.id] = true
        }
      });
    }

    // wait 100ms past last response, then run cleanup methods
    if( this.bufferTimer !== -1 ) {
      clearTimeout(this.bufferTimer);
    }

    this.bufferTimer = setTimeout(() => {
      this.awaitingResponses = false;
      this.bufferTimer = -1;

      for( let key in this.responses ) {
        // check for errors
        if( !this.models[key] ) {
          console.warn('keepalive model got request for unknown model: '+key);
          continue;
        }

        this.models[key].cleanup(this.responses[key]);
      }
    }, 100);
  }
}


module.exports = new FirestoreKeepaliveModel();