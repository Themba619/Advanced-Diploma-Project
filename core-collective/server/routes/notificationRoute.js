const express = require("express");
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controller/notificationController");

// Create a new notification
router.post("/create", createNotification);

// Get notifications for a user
router.get("/user/:userEmail", getUserNotifications);

// Get unread notification count for a user
router.get("/unread-count/:userEmail", getUnreadCount);

// Mark notification as read
router.put("/read/:notificationId", markAsRead);

// Mark all notifications as read for a user
router.put("/read-all", markAllAsRead);

// Delete a notification
router.delete("/:notificationId", deleteNotification);

module.exports = router;
