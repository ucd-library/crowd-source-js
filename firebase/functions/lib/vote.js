const firebase = require('./firebase-admin');

class Vote {

  constructor() {
    this.setMiddleware = this.setMiddleware.bind(this);
    this.removeMiddleware = this.removeMiddleware.bind(this);
  }

  async setMiddleware(req, res) {
    try {
      let user = this._getUser(req);
      await this.set(user.uid, req.params.crowdInputId, req.body);
    } catch(e) {
      this._handleError(e, res);
    }
  }

  set(userId, crowdInputId, vote) {
    let data = {
      votes : {
        [userId] : vote
      }
    };

    return firebase.firestore()
      .collection('crowd-inputs')
      .doc(crowdInputId)
      .set(data, {merge:true});
  }

  async removeMiddleware(req, res) {
    try {
      let user = this._getUser(req);
      await this.set(user.uid, req.params.crowdInputId, req.body);
    } catch(e) {
      this._handleError(e, res);
    }
  }

  remove(userId, crowdInputId) {
    let data = {
      votes : {
        [userId] : null
      }
    };

    return firebase.firestore()
      .collection('crowd-inputs')
      .doc(crowdInputId)
      .set(data, {merge:true});
  }

  _handleError(error, res) {
    if( error instanceof AccessError ) {
      res.status(403).json(error.message);
    } else {
      res.status(400).json({error: true, message: error.message});
    }
  }

  async _getUser(req) {
    let token = (req.get('Authorization') || '').replace('Bearer ');
    if( !token ) throw new AccessError('No authorization provided');

    try {
      return await firebase.auth().verifyIdToken(idToken)
    } catch(e) {
      throw new AccessError(e.message);
    }
  }

}

class AccessError extends Error {}

module.exports = new Vote();