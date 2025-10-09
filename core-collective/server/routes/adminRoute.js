const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");

// Admin authentication
router.post("/authenticate", adminController.authenticateAdmin);

// Search for post by ID
router.get("/search-post/:postId", adminController.searchPostById);

// Delete post
router.delete("/delete-post/:postId", adminController.deletePost);

// Send warning email
router.post("/send-warning", adminController.sendWarningEmail);

// Delete user account
router.delete("/delete-user", adminController.deleteUserAccount);

module.exports = router;
