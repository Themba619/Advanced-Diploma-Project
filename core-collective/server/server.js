require("dotenv").config();
const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const fetch = require("node-fetch");
const querystring = require("querystring");

let aiAuthCookie = null;

const app = express();
const PORT = process.env.PORT || 3001;
const FILE_PATH = path.join(__dirname, "forumData.json");

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "corecollective",
  password: "postgres",
  port: 5432,
});

// Export cookie and pool for use in other modules
module.exports.aiAuthCookie = () => aiAuthCookie;
module.exports.pool = pool;

// Routes
const profanityRoute = require("./routes/profanityRoute");
const emailRoute = require("./routes/emailRoute");
// const ollamaRoute = require("./routes/ollamaRoute");
const privateRoute = require("./routes/privateRoute");

// Middleware
app.use(cors());
app.use(express.json());

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "default_jwt_secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = user; // { userId, email, fullName }
      next();
    }
  );
};

app.use("/api/profanityRoute", profanityRoute);
app.use("/api/email", emailRoute);
app.use("/api/private", authenticateToken, privateRoute); // Protect private routes with JWT

async function loginAndStoreCookie() {
  if (aiAuthCookie) {
    console.log("AI Auth Cookie already set:", aiAuthCookie);
    return;
  }
  const loginUrl = "https://api.privatecore.app/auth/login";
  const loginData = querystring.stringify({
    username: "fakej710@gmail.com",
    password: "PointBreak2014!!!!",
  });

  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: loginData,
  });

  if (!response.ok) {
    throw new Error("Login failed: " + response.status);
  }

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    aiAuthCookie = setCookie.split(";")[0];
    console.log("AI Auth Cookie set:");
  } else {
    throw new Error("No cookie returned from login");
  }
}

// Call this once on server startup if cookie is not already set
if (!aiAuthCookie) {
  console.log("AI Auth Cookie is null, logging in...");
  loginAndStoreCookie().catch(console.error);
} else {
  console.log("AI Auth Cookie already exists:");
}

// Initialize forumData.json with empty array if it doesn't exist
async function initializeFile() {
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, JSON.stringify([], null, 2));
  }
}

app.get("/api/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "success", time: result.rows[0].now });
  } catch (err) {
    console.error("Database connection test failed:", err);
    res.status(500).json({ status: "fail", error: err.message });
  }
});

// Add this new endpoint:
app.get("/api/db-tables", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);
    res.json({ tables: result.rows });
  } catch (err) {
    console.error("Error getting tables:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create user_sessions table if it doesn't exist
app.get("/api/init-db", async (req, res) => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, session_id)
      )
    `);

    res.json({
      message:
        "Database initialized successfully - users and user_sessions tables created",
    });
  } catch (err) {
    console.error("Error initializing database:", err);
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint for JWT authentication
app.get("/api/test-auth", authenticateToken, (req, res) => {
  res.json({
    message: "Authentication successful",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// --- Existing JSON file-based post and reply endpoints (untouched) ---
app.get("/posts", async (req, res) => {
  try {
    await initializeFile();
    const data = await fs.readFile(FILE_PATH, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading posts:", error);
    res.status(500).json({ error: "Failed to read posts" });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const newPost = req.body;
    if (!newPost.title || !newPost.description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }
    await initializeFile();
    const data = await fs.readFile(FILE_PATH, "utf8");
    const posts = JSON.parse(data);
    posts.push(newPost);
    await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
    res.status(200).json({ message: "Post added successfully", post: newPost });
  } catch (error) {
    console.error("Error saving post:", error);
    res.status(500).json({ error: "Failed to save post" });
  }
});

app.post("/posts/:postId/replies", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { content, parentReplyId } = req.body;
  const newReply = {
    id: Date.now(),
    user: "Anonymous",
    content,
    timeAgo: new Date(),
    replies: [],
    likes: 0,
    likedBy: [],
  };
  try {
    const data = await fs.readFile(FILE_PATH, "utf8");
    let posts = JSON.parse(data);
    const addNestedReply = (replies) => {
      return replies.map((reply) => {
        if (reply.id === parentReplyId) {
          return { ...reply, replies: [newReply, ...reply.replies] };
        }
        return { ...reply, replies: addNestedReply(reply.replies) };
      });
    };
    posts = posts.map((post) => {
      if (post.id === postId) {
        if (!parentReplyId) {
          post.replies.unshift(newReply);
        } else {
          post.replies = addNestedReply(post.replies);
        }
        post.chatCount++;
      }
      return post;
    });
    await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
    res.status(201).json({ message: "Reply added successfully" });
  } catch (error) {
    console.error("Error saving reply:", error);
    res.status(500).json({ error: "Failed to save reply" });
  }
});

// Like/Unlike reply endpoints
app.post(
  "/posts/:postId/replies/:replyId/like",
  authenticateToken,
  async (req, res) => {
    const postId = parseInt(req.params.postId);
    const replyId = parseFloat(req.params.replyId);
    const userEmail = req.user.email;

    try {
      const data = await fs.readFile(FILE_PATH, "utf8");
      let posts = JSON.parse(data);

      const updateReplyLikes = (replies) => {
        return replies.map((reply) => {
          if (reply.id === replyId) {
            // Initialize likes fields if they don't exist
            if (!reply.likes) reply.likes = 0;
            if (!reply.likedBy) reply.likedBy = [];

            // Check if user already liked this reply
            const userIndex = reply.likedBy.indexOf(userEmail);
            if (userIndex === -1) {
              // User hasn't liked it, add like
              reply.likes++;
              reply.likedBy.push(userEmail);
            } else {
              // User already liked it, remove like (unlike)
              reply.likes--;
              reply.likedBy.splice(userIndex, 1);
            }
            return reply;
          }
          // Check nested replies
          reply.replies = updateReplyLikes(reply.replies);
          return reply;
        });
      };

      posts = posts.map((post) => {
        if (post.id === postId) {
          post.replies = updateReplyLikes(post.replies);
        }
        return post;
      });

      await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
      res.status(200).json({ message: "Like status updated successfully" });
    } catch (error) {
      console.error("Error updating like:", error);
      res.status(500).json({ error: "Failed to update like" });
    }
  }
);

//Register endpoint ---
app.post("/api/auth/register", async (req, res) => {
  const { fullName, name, email, password } = req.body;

  // Handle both fullName and name fields
  const finalFullName = fullName || name;

  // Debug logging
  console.log("Registration attempt:", {
    fullName: fullName || "undefined",
    name: name || "undefined",
    finalFullName: finalFullName || "undefined",
    email: email || "undefined",
    password: password ? "[PROVIDED]" : "undefined",
    bodyKeys: Object.keys(req.body),
  });

  if (!finalFullName || !email || !password) {
    return res.status(400).json({
      error: "All fields are required",
      received: {
        fullName: !!finalFullName,
        email: !!email,
        password: !!password,
      },
    });
  }

  // Password complexity requirements - updated to include more special characters
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)",
    });
  }

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email",
      [finalFullName, email, passwordHash]
    );
    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

//Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Add fullName to the JWT payload:
    const token = jwt.sign(
      { userId: user.id, email: user.email, fullName: user.full_name },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: "24h" } // Increased from 1h to 24h
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

//Change Password endpoint
app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: "Current password and new password are required",
    });
  }

  // Password complexity requirements - same as registration
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error:
        "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)",
    });
  }

  try {
    // Get user from database using userId from JWT token
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.userId,
    ]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash
    );
    if (isSamePassword) {
      return res.status(400).json({
        error: "New password must be different from current password",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newPasswordHash,
      req.user.userId,
    ]);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error during password change" });
  }
});

// Get user profile endpoint
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, full_name, email, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error while fetching profile" });
  }
});

// ...existing code...

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
