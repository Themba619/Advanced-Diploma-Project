const express = require('express');
const router = express.Router();
const sendEmail = require('../controller/emailController').sendEmail;

router.post("/send-email", sendEmail);

module.exports = router;