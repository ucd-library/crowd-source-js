const admin = require('firebase-admin');

// We are using our own service account so we know which RSA
// public key to use to decode token
const serviceAccount = require('../service-account');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
admin.firestore().settings({
  timestampsInSnapshots: true
});

module.exports = admin;