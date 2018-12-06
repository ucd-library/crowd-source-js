const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/crowd-input', require('./crowd-input'));

module.exports = router;