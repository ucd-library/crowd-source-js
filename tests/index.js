// setup admin config;
const config = require('../admin/config');
const path = require('path');

config.pgr.host = 'http://localhost:6080'
config.pgr.secret = require('./secrets').pgr;
config.firebase.serviceAccountPath = path.join(__dirname, 'service-account.json'); 

require('./utils/auth');
require('./app');
// require('./crowd-inputs');
// require('./utils/disconnect');