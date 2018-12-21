const router = require('express').Router();
const auth = require('../lib/auth');

router.use('/user-token', async (req, res) => {
  let auth0Jwt = req.body;

  if( !auth0Jwt ) {
    return res.status(400).json({
      error: true,
      message : 'jwt token required in body'
    });
  }

  try {
    res.json(await auth.generateUserTokens(auth0Jwt));
  } catch(e) {
    res.status(400).json({
      error: true,
      message : e.message
    });
  }
});

router.use('/anonymous-tokens', async (req, res) => {
  try {
    res.json(await auth.generateAnonymousTokens());
  } catch(e) {
    res.status(400).json({
      error: true,
      message : e.message
    });
  }
});

module.exports = router;