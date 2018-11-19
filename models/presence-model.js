const {BaseModel} = require('@ucd-lib/cork-app-utils');
const PresenceService = require('../services/presence-service');
const PresenceStore = require('../stores/presence-store');

class PresenceModel extends BaseModel {

  constructor() {
    super();

    this.service = PresenceService;
    this.store = PresenceStore;

    this.register('PresenceModel');
  }

}

module.exports = new CrowdInputsModel();