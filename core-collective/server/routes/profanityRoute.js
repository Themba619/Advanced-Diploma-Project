const express = require('express');
const { checkProfanity } = require('../controller/profanityCheckerController');

const router = express.Router();

router.post('/check', checkProfanity);

module.exports = router;
