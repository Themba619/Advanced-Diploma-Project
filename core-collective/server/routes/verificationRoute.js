const express = require('express');
const router = express.Router();
const verificationController = require('../controller/verificationController');

router.post("/verify-email", verificationController.verifyEmail);
router.post("/resend-verification", verificationController.resendVerificationCode);

module.exports = router;