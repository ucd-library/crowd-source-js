const admin = require('../lib/firebase-admin');
const jwt = require('jsonwebtoken');
const _request = require('request');

const SERVICE_ACCOUNT_MATCH = /iam\.gserviceaccount\.com$/;
let CACHE = {};

function request(uri, options={}) {
  return new Promise((resolve, reject) => {
    _request(uri, options, (error, response) => {
      if( error ) reject(error);
      else resolve(response);
    });
  });
}

async function setUser(req, res, next) {
  req.user = null;

  let token = req.get('Authorization');
  if( !token ) return;
  
  token = token.replace(/^Bearer /, '');
  // TODO: use id token or pull public key from api using sub/kid property
  // example: https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-98531%40price-the-vintage-dams.iam.gserviceaccount.com

  let user = null;

  try {
    // first, see if this is a firebase id token
    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch(e) {}

  // pull 
  let decoded = jwt.decode(token);
  if( decoded.sub && decoded.sub.match(SERVICE_ACCOUNT_MATCH) ) {
    let keys = await getPublicKeys(decoded.sub);
    for( let kid of keys ) {
      try {
        req.user = await jwt.verify(token, keys[kid], {algorithms:'RS256'});
        return next();
      } catch(e) {}
    }
  }

  next();
}


async function getPublicKeys(sub) {
  if( cache[sub] ) return sub;

  let response = await require(`https://www.googleapis.com/robot/v1/metadata/x509/${encodeURI(sub)}`);
  cache[sub] = JSON.parse(response.body);
  return cache[sub];
}