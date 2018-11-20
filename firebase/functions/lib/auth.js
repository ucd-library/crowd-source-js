const firebase = require('./firebase-admin');
const deepEqual = require('fast-deep-equal');
const uuid = require('uuid');
const config = require('../config');
const secrets = require('../secrets');

/**
 * Handle auth0 authentication and token minting
 */
class Auth {

  constructor() {
    this.jwksClient = jwksClient({
      jwksUri: config.auth0.jwksUrl
    });

    // bind up callback functions
    this._getJwksKey = this._getJwksKey.bind(this);
    this.userMiddleware = this.userMiddleware.bind(this);
    this.anonymouseMiddleware = this.anonymousMiddleware.bind(this);
  }

  /**
   * @method userMiddleware
   * @description handle express request for generating
   * user jwt tokens
   * 
   * @param {Object} req express request
   * @param {Object} res express response
   */
  async userMiddleware(req, res) {
    let auth0Jwt = req.body;
    if( !auth0Jwt ) {
      return res.status(400).json({
        error: true,
        message : 'jwt token required in body'
      });
    }

    try {
      res.json(await this.generateUserTokens(auth0Jwt));
    } catch(e) {
      res.status(400).json({
        error: true,
        message : e.message
      });
    }
  }

  /**
   * @method anonymousMiddleware
   * @description handle express request for generating anonymous
   * user jwt tokens
   * 
   * @param {Object} req express request
   * @param {Object} res express response
   */
  async anonymousMiddleware(req, res) {
    try {
      res.json(await this.generateAnonymousTokens());
    } catch(e) {
      res.status(400).json({
        error: true,
        message : e.message
      });
    }
  }

  /**
   * @method generateAnonymousTokens
   * @description generate jwt tokens for an anonymous user
   * 
   * @returns {Promise} resolves to Object
   */
  async generateAnonymousTokens() {
    let userId = uuid.v4();

    let firebaseClaim = {isAnonymous: true};
    let pgrRole = 'anon';

    return {
      userId,
      firebase : await this._generateFirebaseToken(userId, firebaseClaim),
      pgr : await this.generatePgrToken(userId, pgrRole)
    }
  }

  /**
   * @method generateUserTokens
   * @description create Firebase and PGR tokens for users jwt.  claims will be
   * based on Auth0 authorization roles (via https://ptv.library.ucdavis.edu/firebase_data namespace).
   * 
   * 
   * @param {String} jwtToken Auth0 JWT token
   */
  async generateUserTokens(jwtToken) {
    let auth0Profile = await this._parseAuth0Token(jwtToken);
    let userId = auth0Profile.sub;
    let claims = profile['https://ptv.library.ucdavis.edu/firebase_data'] || {};
    let roles = claims.roles || [];
    
    // create jwt claims
    let firebaseClaim = {};
    let pgrRole = '';

    if( roles.indexOf('admin') > -1 ) {
      firebaseClaim.isAdmin = true;
      pgrRole = 'admin';
    } else if( roles.indexOf('editor') > -1 ) {
      pgrRole = 'editor';
    }

    // create jwts
    return {
      userId,
      firebase : await this._generateFirebaseToken(userId, firebaseClaim),
      pgr : await this.generatePgrToken(userId, pgrRole)
    }
  }

  generatePgrToken(userId, role) {
    return jwt.sign(
      {userId, role}, 
      secrets.pgr, 
      {expiresIn: '1d'}
    );
  }

  /**
   * @method _generateFirebaseToken
   * @description generate a firebase jwt token for a user.  This fn will
   * also ensure that the users claims are associated with their firebase
   * account which has to be manually done and is important for user administration
   * via the firebase admin API.
   * 
   * @param {String} userId user id
   * @param {Object} claim user claims
   * @param {Boolean} claim.isAdmin user has admin rights
   * @param {Boolean} claim.isAnonymous is anonymous user
   */
  async _generateFirebaseToken(userId, claim={}) {
    try {
      let user = (await firebase.auth().getUser(userId)).toJSON();
      if( !deepEqual(claim, user.customClaims) ) {
        await firebase.auth().setCustomUserClaims(userId, claim);
      }
    } catch(e) {
      await firebase.auth().createUser({uid: userId});
      await firebase.auth().setCustomUserClaims(userId, claim);
    }

    return firebase.auth().createCustomToken(userId, claim);
  }

  /**
   * @method _parseAuth0Token
   * @description verify a Auth0 jwt.  wraps jsonwebtoken verify
   * library with jwks/RS256 verification config in promise wrapper. 
   * 
   * @param {String} jwtToken 
   * 
   * @returns {Promise}
   */
  _parseAuth0Token(jwtToken) {
    return new Promise((resolve, reject) => {
      jwt.verify(
        jwtToken, 
        this._getJwksKey, 
        { algorithms: ['RS256'] }, 
        (err, decoded) => {
          if( err ) reject(err);
          else resolve(decoded);
        }
      );
    });
  }

  /**
   * @method _getJwksKey
   * @description get the auth0 jwks signing key.  Caches for 1 hour.
   * 
   * See jsonwebtoken docs for more (scroll to jwks example): 
   * https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
   * 
   * @param {Object} header header from jsonwebtoken library 
   * @param {Function} callback 
   */
  _getJwksKey(header, callback) {
    if( this.auth0SigningKey ) {
      return callback(null, this.signingKey);
    }

    this.jwksClient.getSigningKey(header.kid, (err, key) => {
      this.auth0SigningKey = key.publicKey || key.rsaPublicKey;
      setTimeout(() => this.auth0SigningKey = null, 60*60*1000);
      callback(null, this.auth0SigningKey);
    });
  }

}

module.exports = new Auth();