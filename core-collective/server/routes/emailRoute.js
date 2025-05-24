const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const sendEmail = require('../controller/emailController').sendEmail;

router.post("/send-email", upload.array('attachments'), sendEmail);

module.exports = router;