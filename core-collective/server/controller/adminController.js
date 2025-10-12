const fs = require("fs").promises;
const path = require("path");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// Admin password (you should set this as an environment variable)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Path to forum data
const FORUM_DATA_PATH = path.join(__dirname, "../forumData.json");

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "thembabiyela20@gmail.com",
    pass: "tpie gilg udvq utgr",
  },
});

// PostgreSQL pool (assuming you have this set up)
let pool;

// Initialize database connection
const initializePool = async () => {
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }
  return pool;
};

// Admin authentication
const authenticateAdmin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Simple password check (you can enhance this with hashing)
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    res.json({ success: true, message: "Admin authenticated successfully" });
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Search for a post by ID
const searchPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    // Read forum data
    const forumData = JSON.parse(await fs.readFile(FORUM_DATA_PATH, "utf8"));

    // Find the post
    const post = forumData.find((p) => p.id == postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if post already has userEmail, otherwise try to get from database
    let userEmail = post.userEmail || null;

    if (!userEmail) {
      try {
        await initializePool();
        const userResult = await pool.query(
          "SELECT email FROM users WHERE id = (SELECT user_id FROM forum_posts WHERE id = $1) LIMIT 1",
          [postId]
        );

        if (userResult.rows.length > 0) {
          userEmail = userResult.rows[0].email;
        }
      } catch (dbError) {
        console.log(
          "Could not fetch user email from database:",
          dbError.message
        );
        // Continue without email - we'll still return the post data
      }
    }

    res.json({
      ...post,
      userEmail: userEmail || "Not available",
    });
  } catch (error) {
    console.error("Search post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    // Read current forum data
    const forumData = JSON.parse(await fs.readFile(FORUM_DATA_PATH, "utf8"));

    // Find the post index
    const postIndex = forumData.findIndex((p) => p.id == postId);

    if (postIndex === -1) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Remove the post
    const deletedPost = forumData.splice(postIndex, 1)[0];

    // Write updated data back to file
    await fs.writeFile(FORUM_DATA_PATH, JSON.stringify(forumData, null, 2));

    // Also try to delete from database if exists
    try {
      await initializePool();
      await pool.query("DELETE FROM forum_posts WHERE id = $1", [postId]);
    } catch (dbError) {
      console.log("Could not delete from database:", dbError.message);
      // Continue - the JSON file deletion is the primary source
    }

    res.json({
      success: true,
      message: "Post deleted successfully",
      deletedPost: deletedPost,
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send warning notification to user (replaces email system)
const sendWarningNotification = async (req, res) => {
  try {
    const { userEmail, userName, postTitle, reason } = req.body;

    if (!userEmail || !userName || !postTitle || !reason) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Use the notification controller to create the notification
    const notificationController = require("./notificationController");

    const notificationData = {
      body: {
        userEmail,
        userName,
        title: "⚠️ Community Guidelines Warning",
        message: `Your post "${postTitle}" has been reviewed and found to potentially violate our community guidelines. Reason: ${reason}. This serves as an official warning. The reported post has been removed from the forum. Future violations may result in temporary or permanent account suspension. We encourage you to review our community guidelines.`,
        type: "warning",
        postTitle,
        reason,
      },
    };

    // Create a mock response object to capture the notification creation result
    let notificationResult = null;
    const mockRes = {
      json: (data) => {
        notificationResult = data;
      },
      status: (code) => ({
        json: (data) => {
          notificationResult = { ...data, statusCode: code };
        },
      }),
    };

    // Create the notification
    await notificationController.createNotification(notificationData, mockRes);

    if (notificationResult && notificationResult.success) {
      // Log the warning for admin records
      console.log(
        `Warning notification created for ${userEmail} for post "${postTitle}" - Reason: ${reason}`
      );

      res.json({
        success: true,
        message: "Warning notification sent successfully",
        details: {
          recipient: userEmail,
          postTitle: postTitle,
          reason: reason,
        },
        notification: notificationResult.notification,
      });
    } else {
      throw new Error("Failed to create notification");
    }
  } catch (error) {
    console.error("Send warning notification error:", error);
    res.status(500).json({ error: "Failed to send warning notification" });
  }
};

// Delete user account
const deleteUserAccount = async (req, res) => {
  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }

    await initializePool();

    // First, check if user exists
    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [userEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Delete user's data from all related tables
    await pool.query("BEGIN");

    try {
      // Delete user's chat messages first (due to foreign key constraints)
      await pool.query("DELETE FROM chat_messages WHERE user_id = $1", [
        user.id,
      ]);

      // Delete user's chat sessions
      await pool.query("DELETE FROM chat_sessions WHERE user_id = $1", [
        user.id,
      ]);

      // Delete user's profile
      await pool.query("DELETE FROM users WHERE id = $1", [user.id]);

      await pool.query("COMMIT");

      // Also remove user's posts from JSON file
      try {
        const forumData = JSON.parse(
          await fs.readFile(FORUM_DATA_PATH, "utf8")
        );
        const filteredPosts = forumData.filter(
          (post) => post.userEmail !== userEmail
        );

        if (filteredPosts.length !== forumData.length) {
          await fs.writeFile(
            FORUM_DATA_PATH,
            JSON.stringify(filteredPosts, null, 2)
          );
          console.log(`Removed forum posts for user: ${userEmail}`);
        }
      } catch (fileError) {
        console.log(
          "Could not remove forum posts from JSON file:",
          fileError.message
        );
        // Continue - database deletion is more important
      }

      // Log admin action for audit trail
      console.log(
        `�️ ADMIN ACTION: User account deleted by admin - ${userEmail}`
      );

      res.json({
        success: true,
        message: "User account deleted successfully",
        deletedUser: userEmail,
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Delete user account error:", error);
    res.status(500).json({ error: "Failed to delete user account" });
  }
};

module.exports = {
  authenticateAdmin,
  searchPostById,
  deletePost,
  sendWarningNotification,
  deleteUserAccount,
};
