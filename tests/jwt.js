const admin = require('../admin/lib/firebase');
const config = require('../admin/config');
const path = require('path');
config.firebase.serviceAccountPath = path.join(__dirname, 'service-account.json'); 
admin.init();

(async function() {
  console.log( await admin.createJwt('alice@test.org'));
})()