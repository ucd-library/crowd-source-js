const router = require('express').Router();
const crowdInput = require('../lib/crowd-input');

router.post('/', async (req, res) => {
  if( !req.user ) return sendAuthError(res, 'No authentication provided');
  
  try {
    let body = req.body;
    if( !body ) throw new Error('Crowd input required in body');

    await crowdInput.update(body);
    res.json({success:true});
  } catch(e) {
    sendError(res, e);
  }
});

router.put('/:id', async (req, res) => {
  if( !req.user ) return sendAuthError(res, 'No authentication provided');

  try {
    let data = await crowdInput.get(req.params.id);
    if( !data ) throw new Error('Unknown crowd input id: '+req.params.id);

    let body = req.body;
    if( !body ) throw new Error('Crowd input required in body');

    if( !req.user.claims.isAdmin ) {
      if( data.userId !== body.userId || data.userId !== req.user.uid ) {
        return sendAuthError(res, 'Unauthorized');
      }
    }

    await crowdInput.update(body);
    res.json({success:true});
  } catch(e) {
    sendError(res, e);
  }
});

router.post('/:id/vote', async (req, res) => {
  if( !req.user ) return sendAuthError(res, 'No authentication provided');

  try {
    let data = await crowdInput.get(req.params.id);
    if( !data ) throw new Error('Unknown crowd input id: '+req.params.id);

    let body = req.body;
    if( !body ) throw new Error('Crowd input vote required in body');

    if( !data.votes ) data.votes = {};
    data.votes[req.user.uid] = body;

    await crowdInput.update(data);
    res.json({success:true});
  } catch(e) {
    sendError(res, e);
  }
});

router.delete('/:id/vote', async (req, res) => {
  if( !req.user ) return sendAuthError(res, 'No authentication provided');

  try {
    let data = await crowdInput.get(req.params.id);
    if( !data ) throw new Error('Unknown crowd input id: '+req.params.id);

    if( data.votes && data.votes[req.user.id] ) {
      delete data.votes[req.user.uid];
      await crowdInput.update(data);
    }
    
    res.json({success:true});
  } catch(e) {
    sendError(res, e);
  }
});

router.post('/validate', (req, res) => {
  let body = req.body;
  if( !body ) return sendError(res, new Error('Body required'));

  try {
    if( typeof body === 'string' ) {
      body = JSON.parse(body);
    }
    crowdInput.verifyCrowdInputSchema(body);
    res.json({valid: true});
  } catch(e) {
    sendError(res, e);
  }
});

function sendAuthError(res, message) {
  res.status(403).json({
    error : true,
    message
  });
}

function sendError(res, e) {
  res.status(400).json({
    error : true,
    message : e.message 
  });
}

module.exports = router;