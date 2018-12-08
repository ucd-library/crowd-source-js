const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const express = require('express');

const auth = require('./lib/auth');
const vote = require('./lib/vote');
const presence = require('./lib/presence');

const app = express();
app.use(cors);
app.use(require('./controllers/middleware').setUser);
app.use(require('./controllers'));

exports.api = functions.https.onRequest(app);
exports.onUserPresenceChanged = presence.trigger();