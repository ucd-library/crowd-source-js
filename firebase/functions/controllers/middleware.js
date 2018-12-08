const admin = require('../lib/firebase-admin');
const auth = require('../lib/auth');

async function setUser(req, res, next) {
  req.user = null;

  let token = req.get('Authorization');
  if( !token ) return next();
  
  token = token.replace(/^Bearer /, '').trim();
  if( !token ) return next();

  try {
    req.user = await auth.verifyFirebaseToken(token);
    return next();
  } catch(e) {}

  try {
    // first, see if this is a firebase id token
    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch(e) {}

  next();
}

module.exports = {setUser};