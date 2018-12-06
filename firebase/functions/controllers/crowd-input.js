const router = require('express').Router();
const crowdInput = require('../lib/crowd-input');

router.post('/', (req, res) => {

});

router.put('/:id', (req, res) => {

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

function sendError(res, e) {
  res.status(400).json({
    error : true,
    message : e.message 
  });
}

module.exports = router;