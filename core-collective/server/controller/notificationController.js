const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

// Path to notifications data file
const NOTIFICATIONS_FILE_PATH = path.join(
  __dirname,
  "../notificationsData.json"
);

// Helper function to read notifications from file
const readNotificationsFile = async () => {
  try {
    const data = await fs.readFile(NOTIFICATIONS_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create it with empty structure
    const initialData = { notifications: [] };
    await fs.writeFile(
      NOTIFICATIONS_FILE_PATH,
      JSON.stringify(initialData, null, 2)
    );
    return initialData;
  }
};

// Helper function to write notifications to file
const writeNotificationsFile = async (data) => {
  await fs.writeFile(NOTIFICATIONS_FILE_PATH, JSON.stringify(data, null, 2));
};

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const {
      userEmail,
      userName,
      title,
      message,
      type = "warning",
      postTitle,
      reason,
    } = req.body;

    if (!userEmail || !userName || !title || !message) {
      return res
        .status(400)
        .json({
          error: "Required fields: userEmail, userName, title, message",
        });
    }

    const data = await readNotificationsFile();

    const newNotification = {
      id: crypto.randomUUID(),
      user_email: userEmail,
      user_name: userName,
      title,
      message,
      type,
      post_title: postTitle || null,
      reason: reason || null,
      is_read: false,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    data.notifications.push(newNotification);
    await writeNotificationsFile(data);

    res.json({
      success: true,
      message: "Notification created successfully",
      notification: newNotification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// Get notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { unreadOnly = false } = req.query;

    if (!userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }

    const data = await readNotificationsFile();

    let userNotifications = data.notifications.filter(
      (n) => n.user_email === userEmail
    );

    if (unreadOnly === "true") {
      userNotifications = userNotifications.filter((n) => !n.is_read);
    }

    // Sort by created_at descending (newest first)
    userNotifications.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const unreadCount = data.notifications.filter(
      (n) => n.user_email === userEmail && !n.is_read
    ).length;

    res.json({
      success: true,
      notifications: userNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get user notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
};

// Get unread notification count for a user
const getUnreadCount = async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }

    const data = await readNotificationsFile();

    const unreadCount = data.notifications.filter(
      (n) => n.user_email === userEmail && !n.is_read
    ).length;

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userEmail } = req.body;

    if (!notificationId || !userEmail) {
      return res
        .status(400)
        .json({ error: "Notification ID and user email are required" });
    }

    const data = await readNotificationsFile();

    const notificationIndex = data.notifications.findIndex(
      (n) => n.id === notificationId && n.user_email === userEmail
    );

    if (notificationIndex === -1) {
      return res
        .status(404)
        .json({ error: "Notification not found or unauthorized" });
    }

    data.notifications[notificationIndex].is_read = true;
    data.notifications[notificationIndex].read_at = new Date().toISOString();

    await writeNotificationsFile(data);

    res.json({
      success: true,
      message: "Notification marked as read",
      notification: data.notifications[notificationIndex],
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }

    const data = await readNotificationsFile();

    let updatedCount = 0;
    const currentTime = new Date().toISOString();

    data.notifications = data.notifications.map((notification) => {
      if (notification.user_email === userEmail && !notification.is_read) {
        updatedCount++;
        return {
          ...notification,
          is_read: true,
          read_at: currentTime,
        };
      }
      return notification;
    });

    await writeNotificationsFile(data);

    res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount,
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userEmail } = req.body;

    if (!notificationId || !userEmail) {
      return res
        .status(400)
        .json({ error: "Notification ID and user email are required" });
    }

    const data = await readNotificationsFile();

    const initialLength = data.notifications.length;
    data.notifications = data.notifications.filter(
      (n) => !(n.id === notificationId && n.user_email === userEmail)
    );

    if (data.notifications.length === initialLength) {
      return res
        .status(404)
        .json({ error: "Notification not found or unauthorized" });
    }

    await writeNotificationsFile(data);

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
