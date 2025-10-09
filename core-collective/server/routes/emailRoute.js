const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const {
  sendEmail,
  sendPasswordResetOTP,
  verifyOTPAndResetPassword,
  resetPasswordWithNewPassword,
  reportPost,
} = require("../controller/emailController");

router.post("/send-email", upload.array("attachments"), sendEmail);
router.post("/send-password-reset-otp", sendPasswordResetOTP);
router.post("/verify-otp-reset-password", verifyOTPAndResetPassword); // Auto-generated password
router.post("/reset-password-with-new-password", resetPasswordWithNewPassword); // User chooses password
router.post("/report-post", reportPost); // Report post functionality

module.exports = router;
