const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const express = require('express');
const auth = require('./lib/auth');
const presence = require('./lib/presence');

const app = express();
app.use(cors);
app.post('user-token', auth.userMiddleware);
app.get('anonymous-tokens', auth.anonymousMiddleware);

exports.api = functions.https.onRequest(app);
exports.onUserPresenceChanged = presence.trigger();