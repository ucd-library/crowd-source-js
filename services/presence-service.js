const {BaseService} = require('@ucd-lib/cork-app-utils');
const PresenceStore = require('../stores/presence-store');
const firestore = require('../lib/firestore');
const config = require('../config');

class CrowdInputsService extends BaseService {


}

module.exports = new CrowdInputsService();