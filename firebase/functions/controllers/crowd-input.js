const router = require('express').Router();
const crowdInput = require('../lib/crowd-input');

router.post('/', (req, res) => {
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
    let data = crowdInput.get(req.param.id);
    if( !data ) throw new Error('Unknown crowd input id: '+req.param.id);

    let body = req.body;
    if( !body ) throw new Error('Crowd input required in body');

    if( data.userId !== body.userId ) {
      return sendAuthError(res, 'Unauthorized');
    }

    await crowdInput.update(body);
    res.json({success:true});
  } catch(e) {
    sendError(res, e);
  }
});

router.post('/:id/vote', (req, res) => {
  
});

router.delete('/:id/vote', (req, res) => {

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